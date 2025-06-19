import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const cuentasPorCobrarRouter = require('express').Router();

interface AbonoBody {
    observaciones?: string;
    tasa_cambio: number;
    pagos: {
        metodo_pago_id: number;
        monto: number;
        moneda: 'USD' | 'VES';
        referencia?: string;
    }[];
}

cuentasPorCobrarRouter.get('/', authenticate(['admin', 'maestro', 'vendedor']), async (req: Request, res: Response) => {
    const { tipo = 'pendientes' } = req.query;
    let whereClause = "WHERE cxc.estado IN ('pendiente', 'abonada', 'vencida')";
    if (tipo === 'historial') {
        whereClause = "WHERE cxc.estado IN ('pagada', 'anulada')";
    }
    try {
        const query = `
            SELECT cxc.id, cxc.venta_id, cxc.monto_original, cxc.monto_pendiente, cxc.fecha_emision, cxc.estado,
                   c.nombre as cliente_nombre
            FROM cuentas_por_cobrar cxc
            JOIN clientes c ON cxc.cliente_id = c.id
            ${whereClause}
            ORDER BY cxc.fecha_emision DESC
        `;
        const [cuentas] = await pool.query(query);
        res.json({ success: true, data: cuentas });
    } catch (error) {
        console.error("Error fetching accounts receivable:", error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

cuentasPorCobrarRouter.post('/:id/abonos', authenticate(['admin', 'maestro', 'vendedor']), async (req: Request, res: Response) => {
    const { id: cuentaId } = req.params;
    const { pagos, observaciones, tasa_cambio } = req.body as AbonoBody;
    const usuario_id = (req as any).user.id;
    
    if (!pagos || pagos.length === 0) {
        return res.status(400).json({ success: false, message: "Debe haber al menos un método de pago." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        const [cuentaResult] = await conn.query<RowDataPacket[]>("SELECT monto_pendiente, venta_id FROM cuentas_por_cobrar WHERE id = ? FOR UPDATE", [cuentaId]);
        
        if (cuentaResult.length === 0) throw new Error("La cuenta por cobrar no existe.");
        
        const montoPendienteActual = Number(cuentaResult[0].monto_pendiente);
        const ventaId = cuentaResult[0].venta_id;

        const montoTotalAbonoUSD = pagos.reduce((sum, p) => {
            const monto = Number(p.monto);
            const tasa = p.moneda === 'VES' ? (tasa_cambio || 1) : 1;
            if (tasa <= 0 && p.moneda === 'VES') throw new Error("La tasa de cambio es inválida.");
            return sum + (p.moneda === 'VES' ? monto / tasa : monto);
        }, 0);

        if (montoTotalAbonoUSD > montoPendienteActual + 0.01) throw new Error("El abono no puede ser mayor al monto pendiente.");

        const [abonoResult] = await conn.query<ResultSetHeader>("INSERT INTO abonos_clientes (cuenta_por_cobrar_id, usuario_id, monto_total_abono, observaciones) VALUES (?, ?, ?, ?)", [cuentaId, usuario_id, montoTotalAbonoUSD, observaciones]);
        const abonoId = abonoResult.insertId;

        for (const pago of pagos) {
            await conn.query("INSERT INTO detalle_abonos_clientes (abono_id, metodo_pago_id, monto, moneda, tasa_cambio, referencia) VALUES (?, ?, ?, ?, ?, ?)", [abonoId, pago.metodo_pago_id, pago.monto, pago.moneda, pago.moneda === 'VES' ? tasa_cambio : 1, pago.referencia]);
        }

        const nuevoMontoPendiente = montoPendienteActual - montoTotalAbonoUSD;
        const nuevoEstado = nuevoMontoPendiente <= 0.01 ? 'pagada' : 'abonada';

        await conn.query("UPDATE cuentas_por_cobrar SET monto_pendiente = ?, estado = ? WHERE id = ?", [nuevoMontoPendiente, nuevoEstado, cuentaId]);
        
        // --- LÓGICA DE ACTUALIZACIÓN DIRECTA Y SEGURA ---
        if (nuevoEstado === 'pagada') {
            await conn.query("UPDATE ventas SET estado = 'completada' WHERE id = ?", [ventaId]);
        }
        
        await conn.commit();
        res.status(201).json({ success: true, message: "Abono registrado correctamente." });

    } catch (error) {
        await conn.rollback();
        const err = error as Error;
        res.status(400).json({ success: false, message: err.message });
    } finally {
        conn.release();
    }
});

export default cuentasPorCobrarRouter;