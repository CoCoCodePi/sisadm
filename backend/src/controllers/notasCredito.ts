import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const notasRouter = require('express').Router();

// Crear una nueva nota de crédito
notasRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { venta_id, monto, motivo } = req.body;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Registrar nota
    await conn.query(
      `INSERT INTO notas_credito 
      (venta_id, monto, motivo, usuario_id)
      VALUES (?, ?, ?, ?)`,
      [venta_id, monto, motivo, req.user!.id]
    );

    // 2. Actualizar saldo pendiente
    await conn.query(
      `UPDATE ventas 
      SET total_pendiente = total_pendiente - ?
      WHERE id = ?`,
      [monto, venta_id]
    );

    await conn.commit();
    res.status(201).json({ success: true });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Error al crear nota' });
  } finally {
    conn.release();
  }
});

// Cerrar una nota de crédito
notasRouter.patch('/:id/cerrar', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [result]: any[] = await pool.query(
      `UPDATE notas_credito 
      SET estado = 'cerrada'
      WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }

    res.json({ success: true, message: 'Nota cerrada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cerrar nota' });
  }
});

// Eliminar una nota de crédito
notasRouter.delete('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [result]: any[] = await pool.query(
      `DELETE FROM notas_credito 
      WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    }

    res.json({ success: true, message: 'Nota eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar nota' });
  }
});

export default notasRouter;