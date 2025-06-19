import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { ResultSetHeader } from 'mysql2/promise';

const inventarioRouter = require('express').Router();

// Obtener vista detallada del inventario actual
inventarioRouter.get('/', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
  try {
    // --- CONSULTA SQL TOTALMENTE REESCRITA PARA MÁXIMA PRECISIÓN ---
    const query = `
      WITH LotesActivos AS (
          SELECT
              li.variante_id,
              l.id AS lote_id,
              l.numero_lote,
              li.cantidad AS cantidad_en_lote,
              p.id AS proveedor_id,
              p.nombre AS proveedor_nombre,
              l.fecha_vencimiento,
              c.id AS compra_id,
              c.estado AS compra_estado
          FROM lotes_inventario li
          JOIN lotes l ON li.lote_id = l.id
          JOIN proveedores p ON l.proveedor_id = p.id
          LEFT JOIN compras c ON l.compra_id = c.id
          WHERE li.cantidad > 0
      )
      SELECT 
          v.id AS variante_id,
          v.nombre AS variante_nombre,
          v.cantidad AS variante_contenido,
          p.nombre AS producto_nombre,
          m.nombre AS marca_nombre,
          p.unidad_medida_base,
          (SELECT SUM(la.cantidad_en_lote) FROM LotesActivos la WHERE la.variante_id = v.id AND (la.compra_estado IS NULL OR la.compra_estado != 'cancelada')) AS stock_total,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT(
              'lote_id', la.lote_id,
              'numero_lote', la.numero_lote,
              'cantidad_en_lote', la.cantidad_en_lote,
              'proveedor_id', la.proveedor_id,
              'proveedor_nombre', la.proveedor_nombre,
              'fecha_vencimiento', la.fecha_vencimiento,
              'compra_id', la.compra_id,
              'compra_estado', la.compra_estado
          )) FROM LotesActivos la WHERE la.variante_id = v.id) AS lotes,
          (SELECT COUNT(*) > 0 FROM LotesActivos la WHERE la.variante_id = v.id AND la.compra_estado = 'cancelada') AS tiene_lotes_anulados
      FROM 
          variantes v
      JOIN 
          productos p ON v.producto_id = p.id
      JOIN 
          marcas m ON p.marca_id = m.id
      WHERE 
          v.id IN (SELECT DISTINCT variante_id FROM LotesActivos);
    `;

    const [inventario] = await pool.query(query);
    res.json({ success: true, data: inventario });

  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al obtener el inventario' });
  }
});

// Registrar un ajuste de inventario (para anular lotes)
inventarioRouter.post('/ajuste', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { lote_id, motivo } = req.body;
    const usuario_id = (req as any).user.id;

    if (!lote_id || !motivo) {
        return res.status(400).json({ success: false, message: "El ID del lote y el motivo son requeridos." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [loteInventario]: any[] = await conn.query("SELECT id, variante_id, cantidad FROM lotes_inventario WHERE lote_id = ? FOR UPDATE", [lote_id]);

        if (loteInventario.length === 0 || loteInventario[0].cantidad <= 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: "El lote no existe en el inventario o ya no tiene stock." });
        }

        const { id: lote_inventario_id, variante_id, cantidad } = loteInventario[0];

        await conn.query<ResultSetHeader>(
            "INSERT INTO movimientos_inventario (variante_id, cantidad, tipo, motivo, usuario_id) VALUES (?, ?, 'salida', ?, ?)",
            [variante_id, -cantidad, motivo, usuario_id]
        );

        await conn.query("UPDATE lotes_inventario SET cantidad = 0 WHERE id = ?", [lote_inventario_id]);

        await conn.commit();
        res.status(200).json({ success: true, message: "Ajuste de inventario realizado con éxito." });

    } catch (error) {
        await conn.rollback();
        console.error("--- ERROR EN POST /api/inventario/ajuste ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al realizar el ajuste.' });
    } finally {
        conn.release();
    }
});

inventarioRouter.get('/stock/:variante_id', authenticate(['admin', 'maestro', 'operador', 'vendedor']), async (req: Request, res: Response) => {
  const { variante_id } = req.params;
  try {
      const query = `
          SELECT 
              COALESCE(SUM(li.cantidad), 0) AS stock_total
          FROM lotes_inventario li
          JOIN lotes l ON li.lote_id = l.id
          LEFT JOIN compras c ON l.compra_id = c.id
          WHERE li.variante_id = ? AND (c.estado IS NULL OR c.estado != 'cancelada');
      `;
      const [rows]: any[] = await pool.query(query, [variante_id]);
      res.json({ success: true, data: { stock: rows[0].stock_total || 0 } });
  } catch (error) {
      console.error(`Error al obtener stock para la variante ${variante_id}:`, error);
      res.status(500).json({ success: false, message: 'Error del servidor al obtener el stock.' });
  }
});
export default inventarioRouter;