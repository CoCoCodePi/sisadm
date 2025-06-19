import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

const ventasRouter = require('express').Router();

// Interfaces del Payload
interface DetalleVentaBody { 
    variante_id: number; 
    cantidad: number; 
    precio_unitario: number; 
    iva_monto: number;
}
interface MetodoPagoBody { 
    metodo_pago_id: number; 
    monto: number; 
    moneda: 'USD' | 'VES'; 
    referencia?: string; 
}
interface VentaBody { 
    cliente_id: number;
    detalles: DetalleVentaBody[]; 
    pagos: MetodoPagoBody[]; 
    moneda: 'USD' | 'VES'; 
    tasa_cambio: number; 
    canal: 'fisico' | 'online'; 
    subtotal: number;
    total_iva: number;
    total_venta: number;
}

// Lógica FIFO para descontar inventario
async function descontarInventarioFIFO(conn: PoolConnection, variante_id: number, cantidadADescontar: number, ventaId: number) {
    const [lotes] = await conn.query<RowDataPacket[]>("SELECT id, cantidad FROM lotes_inventario WHERE variante_id = ? AND cantidad > 0 ORDER BY fecha_actualizacion ASC FOR UPDATE", [variante_id]);
    const cantidadTotalEnStock = lotes.reduce((sum, lote) => sum + lote.cantidad, 0);
    if (cantidadTotalEnStock < cantidadADescontar) {
        throw new Error(`Stock insuficiente para la variante ID ${variante_id}. Stock actual: ${cantidadTotalEnStock}, Requerido: ${cantidadADescontar}`);
    }
    let cantidadRestanteADescontar = cantidadADescontar;
    for (const lote of lotes) {
        if (cantidadRestanteADescontar <= 0) break;
        const cantidadEnLote = lote.cantidad;
        const cantidadADescontarDeLote = Math.min(cantidadEnLote, cantidadRestanteADescontar);
        await conn.query("UPDATE lotes_inventario SET cantidad = cantidad - ? WHERE id = ?", [cantidadADescontarDeLote, lote.id]);
        await conn.query<ResultSetHeader>("INSERT INTO movimientos_inventario (variante_id, cantidad, tipo, motivo) VALUES (?, ?, 'salida', ?)", [variante_id, -cantidadADescontarDeLote, `Venta #${ventaId}`]);
        cantidadRestanteADescontar -= cantidadADescontarDeLote;
    }
}

// POST /api/ventas - Registrar una nueva venta
ventasRouter.post('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
    const { cliente_id, detalles, pagos, moneda, tasa_cambio, canal, subtotal, total_iva, total_venta } = req.body as VentaBody;
    const usuario_id = (req as any).user.id;
    
    if (!cliente_id || !detalles || detalles.length === 0 || !moneda || !tasa_cambio || tasa_cambio <= 0 || !canal) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos para la venta." });
    }
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        const totalPagadoUSD = pagos.reduce((sum, pago) => {
            const montoEnUSD = pago.moneda === 'VES' ? pago.monto / tasa_cambio : pago.monto;
            return sum + montoEnUSD;
        }, 0);

        const montoPendiente = total_venta - totalPagadoUSD;
        if (montoPendiente < -0.01) {
             throw new Error("El monto pagado no puede ser mayor al total de la venta.");
        }

        const codigoVenta = `VEN-${Date.now()}`;
        const estadoVenta = montoPendiente <= 0.01 ? 'completada' : 'pendiente';

        const [ventaResult] = await conn.query<ResultSetHeader>(
            "INSERT INTO ventas (codigo_venta, cliente_id, usuario_id, subtotal, total_iva, total_venta, moneda, tasa_cambio, canal, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [codigoVenta, cliente_id, usuario_id, subtotal, total_iva, total_venta, moneda, tasa_cambio, canal, estadoVenta]
        );
        const ventaId = ventaResult.insertId;

        for (const detalle of detalles) {
            await descontarInventarioFIFO(conn, detalle.variante_id, detalle.cantidad, ventaId);
            await conn.query<ResultSetHeader>( "INSERT INTO detalles_venta (venta_id, variante_id, cantidad, precio_unitario, iva_monto, moneda, tasa_cambio) VALUES (?, ?, ?, ?, ?, ?, ?)", [ventaId, detalle.variante_id, detalle.cantidad, detalle.precio_unitario, detalle.iva_monto, moneda, tasa_cambio]);
        }

        if (pagos && pagos.length > 0) {
            const [pagoResult] = await conn.query<ResultSetHeader>( "INSERT INTO pagos (venta_id, fecha, moneda_base, tasa_base) VALUES (?, NOW(), ?, ?)", [ventaId, moneda, tasa_cambio] );
            const pagoId = pagoResult.insertId;
            for (const pago of pagos) {
                await conn.query<ResultSetHeader>( "INSERT INTO detalle_metodos_pago (pago_id, metodo_pago_id, monto, moneda, tasa_cambio, referencia) VALUES (?, ?, ?, ?, ?, ?)", [pagoId, pago.metodo_pago_id, pago.monto, pago.moneda, pago.moneda === 'VES' ? tasa_cambio : 1, pago.referencia || null] );
            }
        }
        
        if (montoPendiente > 0.01) {
            const [clienteResult] = await conn.query<RowDataPacket[]>("SELECT permite_credito, limite_credito FROM clientes WHERE id = ?", [cliente_id]);
            if (clienteResult.length === 0 || !clienteResult[0].permite_credito) {
                throw new Error("Este cliente no tiene el crédito habilitado.");
            }
            
            const limiteCredito = clienteResult[0].limite_credito;
            const [deudaResult] = await conn.query<RowDataPacket[]>("SELECT SUM(monto_pendiente) as deuda_actual FROM cuentas_por_cobrar WHERE cliente_id = ? AND estado IN ('pendiente', 'abonada')", [cliente_id]);
            const deudaActual = deudaResult[0].deuda_actual || 0;
            
            if (limiteCredito > 0 && (deudaActual + montoPendiente) > limiteCredito) {
                throw new Error(`El límite de crédito del cliente ($${limiteCredito}) será excedido.`);
            }
    
            const fechaVencimiento = new Date();
            await conn.query<ResultSetHeader>("INSERT INTO cuentas_por_cobrar (venta_id, cliente_id, monto_original, monto_pendiente, fecha_emision, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, NOW(), ?, 'pendiente')", [ventaId, cliente_id, total_venta, montoPendiente, fechaVencimiento]);
        }

        await conn.commit();
        res.status(201).json({ success: true, message: 'Venta registrada exitosamente', data: { ventaId, codigoVenta } });

    } catch (error) {
        await conn.rollback();
        console.error("--- ERROR EN POST /api/ventas ---", error);
        const err = error as Error;
        res.status(500).json({ success: false, message: err.message || 'Error del servidor al registrar la venta.' });
    } finally {
        conn.release();
    }
});

// GET /api/ventas - Listar todas las ventas con paginación y filtros
ventasRouter.get('/', authenticate(['admin', 'maestro', 'vendedor']), async (req: Request, res: Response) => {
    const { page = 1, limit = 15, fechaInicio, fechaFin, clienteId } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClauses = [];
    let params: (string | number)[] = [];

    if (fechaInicio && fechaFin) {
        whereClauses.push("DATE(v.creado_en) BETWEEN ? AND ?");
        params.push(fechaInicio as string, fechaFin as string);
    }
    if (clienteId) {
        whereClauses.push("v.cliente_id = ?");
        params.push(clienteId as string);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const dataQuery = `
            SELECT 
                v.id, v.codigo_venta, v.creado_en AS fecha, v.total_venta, v.estado,
                c.nombre as cliente_nombre,
                u.nombre as vendedor_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            ${whereString}
            ORDER BY v.creado_en DESC
            LIMIT ? OFFSET ?
        `;
        const [ventas] = await pool.query(dataQuery, [...params, parseInt(limit as string), offset]);
        
        const countQuery = `SELECT COUNT(*) as total FROM ventas v ${whereString}`;
        const [totalResult] = await pool.query<RowDataPacket[]>(countQuery, params);
        
        res.json({ success: true, data: ventas, total: totalResult[0].total });
    } catch (error) {
        console.error("--- ERROR EN GET /api/ventas ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener las ventas.' });
    }
});

// GET /api/ventas/:id - Obtener el detalle de una venta
ventasRouter.get('/:id', authenticate(['admin', 'maestro', 'vendedor']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const ventaQuery = `
            SELECT v.*, v.creado_en AS fecha, c.nombre as cliente_nombre, c.documento as cliente_documento, td.codigo as cliente_tipo_documento, u.nombre as vendedor_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN tipo_documentos td ON c.tipo_documento_id = td.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = ?`;
        const [ventaResult] = await pool.query<RowDataPacket[]>(ventaQuery, [id]);

        if (ventaResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Venta no encontrada.' });
        }
        const venta = ventaResult[0];

        // --- CORRECCIÓN: Se eliminó 'vr.codigo_barras' de la consulta ---
        const detallesQuery = `
            SELECT dv.*, p.nombre as producto_nombre, vr.nombre as variante_nombre
            FROM detalles_venta dv
            JOIN variantes vr ON dv.variante_id = vr.id
            JOIN productos p ON vr.producto_id = p.id
            WHERE dv.venta_id = ?`;
        const [detalles] = await pool.query(detallesQuery, [id]);
        
        const pagosQuery = `
            SELECT dmp.*, mp.nombre as metodo_nombre
            FROM detalle_metodos_pago dmp
            JOIN metodos_pago mp ON dmp.metodo_pago_id = mp.id
            WHERE dmp.pago_id IN (SELECT id FROM pagos WHERE venta_id = ?)`;
        const [pagos] = await pool.query(pagosQuery, [id]);

        res.json({ success: true, data: { ...venta, detalles, pagos } });

    } catch (error) {
        console.error(`--- ERROR EN GET /api/ventas/${id} ---`, error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener el detalle de la venta.' });
    }
});

export default ventasRouter;