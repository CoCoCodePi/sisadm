import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import createHttpError from 'http-errors';

const inventarioRouter = require('express').Router();

// Tipos TypeScript
interface AjusteInventario {
  producto_id: number;
  cantidad: number;
  motivo: string;
  ubicacion?: 'fisico' | 'online';
}

interface TransferenciaInventario {
  producto_id: number;
  desde: 'fisico' | 'online';
  hacia: 'fisico' | 'online';
  cantidad: number;
}

// Función para validar datos de entrada de ajuste de inventario
const validarAjusteInventario = (ajuste: AjusteInventario) => {
  if (!ajuste.producto_id || !Number.isInteger(ajuste.cantidad) || ajuste.cantidad <= 0) {
    throw createHttpError(400, 'Datos de entrada inválidos');
  }
};

// Función para validar datos de entrada de transferencia de inventario
const validarTransferenciaInventario = (transferencia: TransferenciaInventario) => {
  if (!transferencia.producto_id || !Number.isInteger(transferencia.cantidad) || transferencia.cantidad <= 0) {
    throw createHttpError(400, 'Datos de entrada inválidos');
  }
};

// 1. Ajustes manuales de inventario
inventarioRouter.post('/ajustes', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const ajuste: AjusteInventario = req.body;
  
  let conn;
  try {
    validarAjusteInventario(ajuste);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Actualizar stock general
    await conn.query(
      `UPDATE inventario 
      SET cantidad = cantidad + ? 
      WHERE producto_id = ?`,
      [ajuste.cantidad, ajuste.producto_id]
    );

    // Registrar movimiento
    await conn.query(
      `INSERT INTO movimientos_inventario 
      (producto_id, cantidad, tipo, canal, motivo) 
      VALUES (?, ?, 'ajuste', ?, ?)`,
      [ajuste.producto_id, ajuste.cantidad, ajuste.ubicacion || 'fisico', ajuste.motivo]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en ajuste' });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// 2. Transferencias entre inventarios
inventarioRouter.post('/transferencias', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const transferencia: TransferenciaInventario = req.body;
  
  let conn;
  try {
    validarTransferenciaInventario(transferencia);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Disminuir origen
    await conn.query(
      `UPDATE inventario 
      SET ${transferencia.desde} = ${transferencia.desde} - ? 
      WHERE producto_id = ?`,
      [transferencia.cantidad, transferencia.producto_id]
    );

    // Aumentar destino
    await conn.query(
      `UPDATE inventario 
      SET ${transferencia.hacia} = ${transferencia.hacia} + ? 
      WHERE producto_id = ?`,
      [transferencia.cantidad, transferencia.producto_id]
    );

    // Registrar movimiento
    await conn.query(
      `INSERT INTO movimientos_inventario 
      (producto_id, cantidad, tipo, canal, motivo) 
      VALUES (?, ?, 'transferencia', ?, ?)`,
      [transferencia.producto_id, transferencia.cantidad, transferencia.hacia, `Transferencia de ${transferencia.desde} a ${transferencia.hacia}`]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en transferencia' });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// 3. Histórico de movimientos
inventarioRouter.get('/movimientos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { producto_id, tipo, fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT m.*, p.nombre AS producto 
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (producto_id) {
      query += ' AND m.producto_id = ?';
      params.push(producto_id);
    }
    if (tipo) {
      query += ' AND m.tipo = ?';
      params.push(tipo);
    }
    if (fecha_inicio && fecha_fin) {
      query += ' AND m.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }

    const [movimientos] = await pool.query(query, params);
    res.json({ success: true, data: movimientos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
  }
});

// 4. Alertas de stock mínimo
inventarioRouter.get('/alertas', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [productos] = await pool.query(`
      SELECT p.id, p.nombre, i.cantidad, i.minimo 
      FROM inventario i
      JOIN productos p ON i.producto_id = p.id
      WHERE i.cantidad <= i.minimo
    `);
    res.json({ success: true, data: productos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en alertas' });
  }
});

export default inventarioRouter;