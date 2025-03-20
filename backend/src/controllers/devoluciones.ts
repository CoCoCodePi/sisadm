import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const devolucionesRouter = require('express').Router();

interface DevolucionBody {
  venta_id: number;
  variante_id: number;
  cantidad: number;
  motivo: string;
}

devolucionesRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const body: DevolucionBody = req.body;
  const usuarioId = req.user!.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Validar existencia de venta y variante
    const [venta]: any[] = await conn.query(
      `SELECT total, moneda, tasa_cambio, total_items 
      FROM ventas WHERE id = ?`,
      [body.venta_id]
    );
    if (!venta.length) {
      throw new Error('Venta no encontrada');
    }

    const [variante]: any[] = await conn.query(
      `SELECT id FROM variantes WHERE id = ?`,
      [body.variante_id]
    );
    if (!variante.length) {
      throw new Error('Variante no encontrada');
    }

    // 2. Registrar devolución
    const [devolucion]: any[] = await conn.query(
      `INSERT INTO devoluciones 
      (venta_id, variante_id, cantidad, motivo, usuario_id)
      VALUES (?, ?, ?, ?, ?)`,
      [body.venta_id, body.variante_id, body.cantidad, body.motivo, usuarioId]
    );

    // 3. Revertir inventario
    await conn.query(
      `UPDATE inventario i
      INNER JOIN variantes v ON i.producto_id = v.producto_id
      SET i.cantidad = i.cantidad + ?
      WHERE v.id = ?`,
      [body.cantidad, body.variante_id]
    );

    // 4. Crear nota de crédito automática
    const montoDevolucion = (body.cantidad * venta[0].total) / venta[0].total_items;
    
    await conn.query(
      `INSERT INTO notas_credito 
      (venta_id, monto, motivo, usuario_id, devolucion_id)
      VALUES (?, ?, ?, ?, ?)`,
      [body.venta_id, montoDevolucion, body.motivo, usuarioId, devolucion.insertId]
    );

    await conn.commit();
    res.status(201).json({ success: true, devolucion_id: devolucion.insertId, monto: montoDevolucion });
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message || 'Error en devolución' });
  } finally {
    conn.release();
  }
});

export default devolucionesRouter;