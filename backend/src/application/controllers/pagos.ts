import { Request, Response } from 'express';
import pool from '../../infrastructure/database/db';
import { authenticate } from '../../infrastructure/middlewares/authMiddleware';

const pagosRouter = require('express').Router();

// Crear un nuevo pago
pagosRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { compra_id, fecha_pago, monto, moneda, metodos_pago } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO pagos (compra_id, fecha_pago, monto, moneda) VALUES (?, ?, ?, ?)`,
      [compra_id, fecha_pago, monto, moneda]
    );
    const pagoId = result.insertId;

    // Insertar detalles de métodos de pago para pagos mixtos
    for (const metodo of metodos_pago) {
      await pool.query(
        `INSERT INTO detalle_metodos_pago (pago_id, monto, metodo_pago, moneda) VALUES (?, ?, ?, ?)`,
        [pagoId, metodo.monto, metodo.metodo_pago, metodo.moneda]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: pagoId }
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear el pago' });
  }
});

// Obtener todos los pagos
pagosRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [pagos]: any[] = await pool.query(`SELECT * FROM pagos`);
    res.json({ success: true, data: pagos });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pagos' });
  }
});

export default pagosRouter;