// Contenido 100% Completo y FINAL
import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

const comprasRouter = require('express').Router();

// --- Interfaces para el Payload ---
interface ItemCompra {
    variante_id: number;
    cantidad: number;
    costo_unitario: number;
    numero_lote: string;
    fecha_vencimiento?: string | null;
}
interface CompraBody {
    proveedor_id: number;
    fecha_orden: string;
    moneda: 'USD' | 'VES';
    tasa_cambio: number;
    items: ItemCompra[];
}

// --- Función Auxiliar para procesar cada item de la compra ---
// MODIFICADO: Ahora recibe 'compraId' para vincular el lote.
async function processPurchaseItem(conn: PoolConnection, item: ItemCompra, compraId: number, proveedorId: number, tasa_cambio: number, moneda: 'USD' | 'VES') {
    const [variantes] = await conn.query<RowDataPacket[]>("SELECT producto_id, costo_promedio FROM variantes WHERE id = ?", [item.variante_id]);
    if (variantes.length === 0) {
        throw new Error(`La variante con ID ${item.variante_id} no existe.`);
    }
    
    const productoId = variantes[0].producto_id;
    const costoPromedioActual = Number(variantes[0].costo_promedio) || 0;

    const [stockData] = await conn.query<RowDataPacket[]>("SELECT SUM(cantidad) as stock_actual FROM lotes_inventario WHERE variante_id = ?", [item.variante_id]);
    const stockActual = Number(stockData[0].stock_actual) || 0;

    const costoUnitarioUSD = moneda === 'VES' ? item.costo_unitario / tasa_cambio : item.costo_unitario;
    const valorInventarioExistente = costoPromedioActual * stockActual;
    const valorInventarioNuevo = costoUnitarioUSD * item.cantidad;
    const cantidadTotalEnStock = stockActual + item.cantidad;
    const nuevoCostoPromedio = cantidadTotalEnStock > 0 ? (valorInventarioExistente + valorInventarioNuevo) / cantidadTotalEnStock : costoUnitarioUSD;

    await conn.query("UPDATE variantes SET costo_promedio = ? WHERE id = ?", [nuevoCostoPromedio, item.variante_id]);

    await conn.query<ResultSetHeader>("INSERT INTO detalle_compras (compra_id, variante_id, cantidad, costo_unitario) VALUES (?, ?, ?, ?)", [compraId, item.variante_id, item.cantidad, costoUnitarioUSD]);
    
    // MODIFICADO: Se inserta el 'compra_id' en la tabla 'lotes'.
    const [loteResult] = await conn.query<ResultSetHeader>(
        "INSERT INTO lotes (numero_lote, proveedor_id, producto_id, compra_id, fecha_vencimiento) VALUES (?, ?, ?, ?, ?)", 
        [item.numero_lote, proveedorId, productoId, compraId, item.fecha_vencimiento || null]
    );
    const loteId = loteResult.insertId;

    await conn.query<ResultSetHeader>("INSERT INTO lotes_inventario (lote_id, variante_id, cantidad) VALUES (?, ?, ?)", [loteId, item.variante_id, item.cantidad]);
    
    await conn.query<ResultSetHeader>("INSERT INTO movimientos_inventario (variante_id, lote_id, cantidad, tipo, motivo) VALUES (?, ?, ?, 'entrada', ?)", [item.variante_id, loteId, item.cantidad, `Compra #${compraId}`]);
}


// --- Endpoints del Router ---
// POST /api/compras - Endpoint principal para registrar una compra
comprasRouter.post('/', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
    const { proveedor_id, fecha_orden, moneda, tasa_cambio, items } = req.body as CompraBody;
    
    if (!proveedor_id || !fecha_orden || !moneda || (moneda === 'VES' && (!tasa_cambio || tasa_cambio <= 0)) || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Faltan datos requeridos o la tasa de cambio es inválida." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const totalCompra = items.reduce((sum, item) => sum + (item.cantidad * item.costo_unitario), 0);
        
        const [compraResult] = await conn.query<ResultSetHeader>(
            "INSERT INTO compras (proveedor_id, fecha_orden, total, moneda, tasa_cambio, estado, codigo_orden) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [proveedor_id, fecha_orden, totalCompra, moneda, tasa_cambio, 'recibida', `COMP-${Date.now()}`]
        );
        const compraId = compraResult.insertId;

        for (const item of items) {
            await processPurchaseItem(conn, item, compraId, proveedor_id, tasa_cambio, moneda);
        }

        const totalCompraUSD = moneda === 'VES' ? totalCompra / tasa_cambio : totalCompra;
        const [proveedorData] = await conn.query<RowDataPacket[]>("SELECT dias_credito FROM proveedores WHERE id = ?", [proveedor_id]);
        const diasCredito = proveedorData[0]?.dias_credito || 0;
        const fechaVencimiento = new Date(fecha_orden);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
        
        await conn.query<ResultSetHeader>(
            "INSERT INTO cuentas_por_pagar (compra_id, monto_original, monto_pendiente, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, ?)",
            [compraId, totalCompraUSD, totalCompraUSD, fechaVencimiento, 'pendiente']
        );

        await conn.commit();
        res.status(201).json({ success: true, message: 'Compra registrada y el inventario ha sido actualizado.', data: { compraId } });
    } catch (error) {
        await conn.rollback();
        console.error("--- ERROR EN POST /api/compras ---", error);
        const err = error as Error;
        res.status(500).json({ success: false, message: err.message || 'Error del servidor al procesar la compra.' });
    } finally {
        conn.release();
    }
});

// ... (El resto del archivo 'compras.ts' no necesita cambios) ...
// GET /api/compras - Listar todas las compras
comprasRouter.get('/', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
    const { page = 1, limit = 10, proveedor_id } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;
    
    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if(proveedor_id) {
        whereClause = 'WHERE c.proveedor_id = ?';
        queryParams.push(proveedor_id as string);
    }
    
    try {
        const dataQuery = `
            SELECT 
                c.id, c.codigo_orden, c.fecha_orden, c.total, c.moneda, c.estado, 
                p.nombre as proveedor_nombre,
                cpp.id as cuenta_por_pagar_id,
                cpp.monto_pendiente,
                cpp.monto_original,
                cpp.estado as estado_pago
            FROM compras c
            LEFT JOIN proveedores p ON c.proveedor_id = p.id
            LEFT JOIN cuentas_por_pagar cpp ON c.id = cpp.compra_id
            ${whereClause}
            ORDER BY c.fecha_orden DESC, c.id DESC
            LIMIT ? OFFSET ?
        `;
        const [compras] = await pool.query(dataQuery, [...queryParams, limitNum, offset]);
        
        const countQuery = `SELECT COUNT(*) as total FROM compras c ${whereClause}`;
        const [totalResult] = await pool.query<RowDataPacket[]>(countQuery, queryParams);
        
        res.json({ success: true, data: compras, total: totalResult[0].total });
    } catch (error) {
        console.error("--- ERROR EN GET /api/compras ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener las compras.' });
    }
});


// GET /api/compras/:id - Obtener el detalle de una compra específica
comprasRouter.get('/:id', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const compraQuery = `
            SELECT c.*, p.nombre as proveedor_nombre, p.rif as proveedor_rif
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            WHERE c.id = ?
        `;
        const [compraResult] = await pool.query<RowDataPacket[]>(compraQuery, [id]);
        if (compraResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Compra no encontrada.' });
        }
        
        const detallesQuery = `
            SELECT dc.*, v.nombre as variante_nombre, p.nombre as producto_nombre
            FROM detalle_compras dc
            JOIN variantes v ON dc.variante_id = v.id
            JOIN productos p ON v.producto_id = p.id
            WHERE dc.compra_id = ?
        `;
        const [detallesResult] = await pool.query(detallesQuery, [id]);
        
        const compraCompleta = { ...compraResult[0], items: detallesResult };
        res.json({ success: true, data: compraCompleta });
    } catch (error) {
        console.error(`--- ERROR EN GET /api/compras/${id} ---`, error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener el detalle de la compra.' });
    }
});

// PUT /api/compras/:id/anular - Anular una compra
comprasRouter.put('/:id/anular', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id: compraId } = req.params;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [cuentas] = await conn.query<RowDataPacket[]>("SELECT monto_pendiente, monto_original FROM cuentas_por_pagar WHERE compra_id = ?", [compraId]);
        if (cuentas.length > 0 && Number(cuentas[0].monto_pendiente) < Number(cuentas[0].monto_original)) {
            throw new Error("No se puede anular una compra que ya tiene pagos o abonos registrados.");
        }

        await conn.query("UPDATE compras SET estado = 'cancelada' WHERE id = ?", [compraId]);
        await conn.query("UPDATE cuentas_por_pagar SET estado = 'anulada' WHERE compra_id = ?", [compraId]);
        
        await conn.commit();
        res.json({ success: true, message: 'La compra ha sido anulada.' });
    } catch (error) {
        await conn.rollback();
        const err = error as Error;
        console.error(`--- ERROR EN PUT /api/compras/${compraId}/anular ---`, err);
        res.status(400).json({ success: false, message: err.message || 'Error del servidor al anular la compra.' });
    } finally {
        conn.release();
    }
});

// DELETE /api/compras/:id - Eliminar físicamente una compra (solo admin)
comprasRouter.delete('/:id', authenticate(['admin']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        await conn.query("DELETE FROM cuentas_por_pagar WHERE compra_id = ?", [id]);
        await conn.query("DELETE FROM detalle_compras WHERE compra_id = ?", [id]);
        
        const [result] = await conn.query<ResultSetHeader>("DELETE FROM compras WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Compra no encontrada.' });
        }
        await conn.commit();
        res.json({ success: true, message: 'Compra eliminada físicamente (acción administrativa).' });
    } catch (error) {
        await conn.rollback();
        console.error(`--- ERROR EN DELETE /api/compras/${id} ---`, error);
        res.status(500).json({ success: false, message: 'Error del servidor al eliminar la compra.' });
    } finally {
        conn.release();
    }
});

export default comprasRouter;