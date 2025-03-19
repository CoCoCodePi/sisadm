import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { generarReporteInventario } from '../services/reportes';

const inventarioRouter = require('express').Router();

// Crear un nuevo producto
inventarioRouter.post('/productos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { nombre, descripcion } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO productos (nombre, descripcion) VALUES (?, ?)`,
      [nombre, descripcion]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear el producto' });
  }
});

// Obtener todos los productos
inventarioRouter.get('/productos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [productos]: any[] = await pool.query(`SELECT * FROM productos`);
    res.json({ success: true, data: productos });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// Crear una nueva variante de producto
inventarioRouter.post('/variantes', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { producto_id, nombre, precio, stock } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO variantes (producto_id, nombre, precio, stock) VALUES (?, ?, ?, ?)`,
      [producto_id, nombre, precio, stock]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear variante:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear la variante' });
  }
});

// Obtener todas las variantes de un producto
inventarioRouter.get('/productos/:id/variantes', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [variantes]: any[] = await pool.query(
      `SELECT * FROM variantes WHERE producto_id = ?`,
      [id]
    );

    res.json({ success: true, data: variantes });
  } catch (error) {
    console.error('Error al obtener variantes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener variantes' });
  }
});

// Registrar un movimiento de inventario
inventarioRouter.post('/movimientos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { variante_id, cantidad, tipo, motivo } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO movimientos_inventario (variante_id, cantidad, tipo, motivo) VALUES (?, ?, ?, ?)`,
      [variante_id, cantidad, tipo, motivo]
    );

    // Actualizar stock de la variante
    await pool.query(
      `UPDATE variantes SET stock = stock + ? WHERE id = ?`,
      [tipo === 'entrada' ? cantidad : -cantidad, variante_id]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al registrar movimiento de inventario:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el movimiento de inventario' });
  }
});

// Obtener todos los movimientos de inventario
inventarioRouter.get('/movimientos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [movimientos]: any[] = await pool.query(`SELECT * FROM movimientos_inventario`);
    res.json({ success: true, data: movimientos });
  } catch (error) {
    console.error('Error al obtener movimientos de inventario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos de inventario' });
  }
});

// Generar reporte de inventario
inventarioRouter.get('/reporte', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await generarReporteInventario();

    res.setHeader('Content-Disposition', 'attachment; filename="reporte_inventario.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar el reporte de inventario' });
  }
});

export default inventarioRouter;