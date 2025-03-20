import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const cuadreCajaRouter = require('express').Router();

// Tipos TypeScript
interface MovimientoCajaBody {
  concepto: string;
  tipo: 'entrada' | 'salida';
  monto: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  referencia?: string;
}

// Abrir caja diaria
cuadreCajaRouter.post('/abrir', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { monto_inicial } = req.body;
  const fecha = new Date().toISOString().split('T')[0];

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO caja_diaria (fecha, hora_apertura, monto_inicial, estado)
      VALUES (?, NOW(), ?, 'abierta')`,
      [fecha, monto_inicial]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al abrir caja:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al abrir la caja'
    });
  }
});

// Cerrar caja diaria
cuadreCajaRouter.post('/cerrar', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { monto_final } = req.body;
  const fecha = new Date().toISOString().split('T')[0];

  try {
    const [caja]: any[] = await pool.query(
      `SELECT id FROM caja_diaria WHERE fecha = ? AND estado = 'abierta'`,
      [fecha]
    );

    if (caja.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay caja abierta para el día de hoy' });
    }

    await pool.query(
      `UPDATE caja_diaria SET hora_cierre = NOW(), monto_final = ?, estado = 'cerrada' WHERE id = ?`,
      [monto_final, caja[0].id]
    );

    res.json({ success: true, message: 'Caja cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ success: false, message: 'Error interno al cerrar la caja' });
  }
});

// Registrar nuevo movimiento de caja
cuadreCajaRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const body: MovimientoCajaBody = req.body;
  const fecha = new Date().toISOString().split('T')[0];

  try {
    const [caja]: any[] = await pool.query(
      `SELECT id FROM caja_diaria WHERE fecha = ? AND estado = 'abierta'`,
      [fecha]
    );

    if (caja.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay caja abierta para el día de hoy' });
    }

    const [result]: any[] = await pool.query(
      `INSERT INTO movimientos_caja (caja_diaria_id, concepto, tipo, monto, metodo_pago, referencia)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [caja[0].id, body.concepto, body.tipo, body.monto, body.metodo_pago, body.referencia]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error en cuadre de caja:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el movimiento de caja' });
  }
});

// Obtener listado de movimientos de caja
cuadreCajaRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { fecha_inicio, fecha_fin, tipo } = req.query;

  try {
    let query = `SELECT * FROM movimientos_caja WHERE 1=1`;
    const params: any[] = [];

    if (fecha_inicio && fecha_fin) {
      query += ' AND fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }

    const [movimientos] = await pool.query(query, params);
    res.json({ success: true, data: movimientos });
  } catch (error) {
    console.error('Error al obtener movimientos de caja:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos de caja' });
  }
});

// Conciliación diaria
cuadreCajaRouter.post('/conciliacion', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { fecha } = req.body;

  try {
    const [ingresos]: any[] = await pool.query(
      `SELECT SUM(monto) as total_ingresos FROM movimientos_caja 
      WHERE tipo = 'entrada' AND DATE(fecha) = DATE(?)`,
      [fecha]
    );

    const [ventas]: any[] = await pool.query(
      `SELECT SUM(total) as total_ventas FROM ventas 
      WHERE DATE(creado_en) = DATE(?)`,
      [fecha]
    );

    const diferencia = (ingresos[0].total_ingresos || 0) - (ventas[0].total_ventas || 0);

    res.json({
      success: true,
      data: {
        total_ingresos: ingresos[0].total_ingresos || 0,
        total_ventas: ventas[0].total_ventas || 0,
        diferencia: diferencia
      }
    });
  } catch (error) {
    console.error('Error en conciliación diaria:', error);
    res.status(500).json({ success: false, message: 'Error al realizar la conciliación diaria' });
  }
});

export default cuadreCajaRouter;