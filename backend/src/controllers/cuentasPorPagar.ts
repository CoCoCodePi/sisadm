import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { body, validationResult } from 'express-validator';

const cuentasRouter = require('express').Router();

// Listar cuentas pendientes
cuentasRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [cuentas] = await pool.query(`
      SELECT cp.*, p.nombre AS proveedor, c.codigo_orden 
      FROM cuentas_por_pagar cp
      JOIN compras c ON cp.compra_id = c.id
      JOIN proveedores p ON c.proveedor_id = p.id
      WHERE cp.estado = 'pendiente'
    `);
    res.json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({ message: 'Error al obtener cuentas' });
  }
});

// Registrar pago a proveedor
cuentasRouter.post(
  '/:id/pagar',
  authenticate(['admin', 'maestro']),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('metodo').isString().withMessage('El método de pago es requerido'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { monto, metodo, referencia } = req.body;
    const cuentaId = req.params.id;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Actualizar cuenta
      const [cuenta]: any[] = await conn.query(
        `SELECT monto_pendiente FROM cuentas_por_pagar WHERE id = ? FOR UPDATE`,
        [cuentaId]
      );

      if (cuenta.length === 0) {
        return res.status(404).json({ message: 'Cuenta no encontrada' });
      }

      if (cuenta[0].monto_pendiente < monto) {
        return res.status(400).json({ message: 'Monto excede el saldo pendiente' });
      }

      await conn.query(
        `UPDATE cuentas_por_pagar 
        SET monto_pendiente = monto_pendiente - ? 
        WHERE id = ?`,
        [monto, cuentaId]
      );

      // 2. Registrar transacción (opcional)
      await conn.query(
        `INSERT INTO transacciones_proveedores (cuenta_id, monto, metodo, referencia) 
        VALUES (?, ?, ?, ?)`,
        [cuentaId, monto, metodo, referencia]
      );

      await conn.commit();
      res.json({ success: true });
    } catch (error) {
      await conn.rollback();
      console.error('Error al procesar pago:', error);
      res.status(500).json({ message: 'Error al procesar pago' });
    } finally {
      conn.release();
    }
  }
);

export default cuentasRouter;