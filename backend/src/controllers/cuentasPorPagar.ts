import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const cuentasPorPagarRouter = require('express').Router();

interface PagoBody {
    fecha_pago: string;
    observacion?: string;
    detalles: {
        metodo_pago_id: number;
        monto: number;
        moneda: 'USD' | 'VES';
        tasa_cambio?: number;
        referencia?: string;
    }[];
}

// GET /api/cuentas-por-pagar - Listar todas las cuentas por pagar con filtro
cuentasPorPagarRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { tipo = 'pendientes' } = req.query; 

    let whereClause = "WHERE cpp.estado IN ('pendiente', 'vencida', 'abonada')";
    if (tipo === 'historial') {
        whereClause = "WHERE cpp.estado IN ('pagada', 'anulada')";
    }

    try {
        const query = `
            SELECT 
                cpp.id, cpp.monto_original, cpp.monto_pendiente, cpp.fecha_vencimiento, cpp.estado,
                c.id as compra_id, c.codigo_orden,
                p.nombre as proveedor_nombre
            FROM cuentas_por_pagar cpp
            JOIN compras c ON cpp.compra_id = c.id
            JOIN proveedores p ON c.proveedor_id = p.id
            ${whereClause}
            ORDER BY cpp.fecha_vencimiento ASC;
        `;
        const [cuentas] = await pool.query(query);
        res.json({ success: true, data: cuentas });
    } catch (error) {
        console.error("--- ERROR EN GET /api/cuentas-por-pagar ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener las cuentas por pagar.' });
    }
});

// GET /api/cuentas-por-pagar/:id - Obtener el detalle de una cuenta
cuentasPorPagarRouter.get('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const cuentaQuery = `
            SELECT 
                cpp.*, 
                c.codigo_orden,
                p.nombre as proveedor_nombre, 
                p.rif as proveedor_rif
            FROM cuentas_por_pagar cpp
            JOIN compras c ON cpp.compra_id = c.id
            JOIN proveedores p ON c.proveedor_id = p.id
            WHERE cpp.id = ?
        `;
        const [cuentaResult] = await pool.query<RowDataPacket[]>(cuentaQuery, [id]);

        if (cuentaResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Cuenta por pagar no encontrada.' });
        }
        const cuenta = cuentaResult[0];

        const pagosQuery = `
            SELECT 
                pap.id, pap.fecha_pago, pap.monto_total_pagado, pap.observacion,
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'metodo', mp.nombre, 
                        'monto', dpp.monto, 
                        'moneda', dpp.moneda, 
                        'referencia', dpp.referencia
                    ))
                    FROM detalle_pagos_a_proveedores dpp
                    JOIN metodos_pago mp ON dpp.metodo_pago_id = mp.id
                    WHERE dpp.pago_id = pap.id
                ) as detalles
            FROM pagos_a_proveedores pap
            WHERE pap.cuenta_por_pagar_id = ?
            ORDER BY pap.fecha_pago DESC
        `;
        const [pagosResult] = await pool.query(pagosQuery, [id]);

        res.json({ success: true, data: { ...cuenta, pagos: pagosResult } });

    } catch (error) {
        console.error(`--- ERROR EN GET /api/cuentas-por-pagar/${id} ---`, error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener el detalle.' });
    }
});

// POST /api/cuentas-por-pagar/:id/pagos - Registrar un nuevo pago
cuentasPorPagarRouter.post('/:id/pagos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id: cuentaPorPagarId } = req.params;
    const { fecha_pago, observacion, detalles } = req.body as PagoBody;

    if (!fecha_pago || !detalles || detalles.length === 0) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos para el pago.' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [cuentas] = await conn.query<RowDataPacket[]>("SELECT monto_pendiente, compra_id FROM cuentas_por_pagar WHERE id = ? FOR UPDATE", [cuentaPorPagarId]);
        if (cuentas.length === 0) throw new Error('La cuenta por pagar no existe.');
        
        const montoPendienteActual = Number(cuentas[0].monto_pendiente);
        const compraId = cuentas[0].compra_id;
        
        const montoTotalPagadoUSD = detalles.reduce((sum, detalle) => {
            const tasa = detalle.moneda === 'VES' ? (detalle.tasa_cambio || 1) : 1;
            if(tasa <= 0 && detalle.moneda === 'VES') throw new Error('La tasa de cambio no puede ser cero o negativa para pagos en VES.');
            const montoEnUSD = detalle.moneda === 'VES' ? detalle.monto / tasa : detalle.monto;
            return sum + montoEnUSD;
        }, 0);

        if (montoTotalPagadoUSD <= 0) throw new Error('El monto total del pago debe ser mayor a cero.');
        if (montoTotalPagadoUSD > montoPendienteActual + 0.01) throw new Error('El pago no puede ser mayor al monto pendiente.');
        
        const [pagoResult] = await conn.query<ResultSetHeader>(
            "INSERT INTO pagos_a_proveedores (cuenta_por_pagar_id, fecha_pago, monto_total_pagado, observacion) VALUES (?, ?, ?, ?)",
            [cuentaPorPagarId, fecha_pago, montoTotalPagadoUSD, observacion || null]
        );
        const pagoId = pagoResult.insertId;

        for (const detalle of detalles) {
            await conn.query<ResultSetHeader>(
                "INSERT INTO detalle_pagos_a_proveedores (pago_id, metodo_pago_id, monto, moneda, tasa_cambio, referencia) VALUES (?, ?, ?, ?, ?, ?)",
                [pagoId, detalle.metodo_pago_id, detalle.monto, detalle.moneda, detalle.moneda === 'VES' ? detalle.tasa_cambio : 1, detalle.referencia || null]
            );
        }
        
        const nuevoMontoPendiente = montoPendienteActual - montoTotalPagadoUSD;
        const nuevoEstado = nuevoMontoPendiente <= 0.01 ? 'pagada' : 'abonada';

        await conn.query("UPDATE cuentas_por_pagar SET monto_pendiente = ?, estado = ? WHERE id = ?", [nuevoMontoPendiente, nuevoEstado, cuentaPorPagarId]);
        
        // Lógica de actualización de estado de la compra
        if (nuevoEstado === 'pagada') {
            await conn.query("UPDATE compras SET estado = 'pagada' WHERE id = ?", [compraId]);
        }

        await conn.commit();
        res.status(201).json({ success: true, message: 'Pago registrado exitosamente.' });
    } catch (error) {
        await conn.rollback();
        console.error(`--- ERROR EN POST /api/cuentas-por-pagar/${cuentaPorPagarId}/pagos ---`, error);
        const err = error as Error;
        res.status(500).json({ success: false, message: err.message || 'Error del servidor al registrar el pago.' });
    } finally {
        conn.release();
    }
});


export default cuentasPorPagarRouter;