import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { validarTasa } from '../services/tasaCambio';

const pagosRouter = require('express').Router();

interface DetallePago {
  metodo_pago_id: number;
  monto: number;
  moneda: 'USD' | 'VES';
  tasa_cambio: number;
}

interface PagoBody {
  venta_id: number;
  detalles: DetallePago[];
}

pagosRouter.post('/', authenticate(['vendedor', 'admin','maestro']), async (req: Request, res: Response) => {
  const body: PagoBody = req.body;
  const usuarioId = req.user!.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Validar venta
    const [venta]: any[] = await conn.query(
      `SELECT total_pendiente 
      FROM ventas 
      WHERE id = ? FOR UPDATE`,
      [body.venta_id]
    );

    if (!venta.length) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }

    // 2. Validar tasas
    for (const detalle of body.detalles) {
      if (detalle.moneda === 'VES' && !(await validarTasa(detalle.tasa_cambio))) {
        return res.status(400).json({
          success: false,
          message: `Tasa de cambio (${detalle.tasa_cambio}) excede la diferencia permitida`
        });
      }
    }

    // 3. Crear pago principal
    const [pagoPrincipal]: any[] = await conn.query(
      `INSERT INTO pagos (venta_id) VALUES (?)`,
      [body.venta_id]
    );
    const pagoId = pagoPrincipal.insertId;

    // 4. Registrar detalles
    let totalPagadoUSD = 0;
    for (const detalle of body.detalles) {
      const montoUSD = detalle.moneda === 'USD' 
        ? detalle.monto 
        : detalle.monto / detalle.tasa_cambio;

      await conn.query(
        `INSERT INTO detalle_metodos_pago 
        (pago_id, metodo_pago_id, monto, moneda, tasa_cambio)
        VALUES (?, ?, ?, ?, ?)`,
        [pagoId, detalle.metodo_pago_id, detalle.monto, detalle.moneda, detalle.tasa_cambio]
      );

      totalPagadoUSD += montoUSD;
    }

    // 5. Actualizar saldo
    await conn.query(
      `UPDATE ventas 
      SET total_pendiente = total_pendiente - ?
      WHERE id = ?`,
      [totalPagadoUSD, body.venta_id]
    );

    await conn.commit();
    res.status(201).json({ success: true, pago_id: pagoId });
    
  } catch (error: any) {
    await conn.rollback();
    console.error('Error en pago:', error);
    res.status(500).json({ success: false, message: 'Error al procesar pago' });
  } finally {
    conn.release();
  }
});

export default pagosRouter;