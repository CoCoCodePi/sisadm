import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const comisionesRouter = require('express').Router();

comisionesRouter.get('/', authenticate(['vendedor', 'admin']), async (req: Request, res: Response) => {
  try {
    // Validar que el usuario esté autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const query = `
      SELECT c.*, v.codigo_venta, u.email AS vendedor
      FROM comisiones c
      JOIN ventas v ON c.venta_id = v.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.usuario_id = ?
    `;
    const [comisiones] = await pool.query(query, [req.user.id]);
    res.json({ success: true, data: comisiones });
  } catch (error) {
    console.error('Error al obtener comisiones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener comisiones' });
  }
});

export default comisionesRouter;