import { Request, Response } from 'express';
import pool from '../../infrastructure/database/db';
import { authenticate } from '../../infrastructure/middlewares/authMiddleware';

const reportesRouter = require('express').Router();

// Histórico de compras por proveedor
reportesRouter.get('/historico-compras', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { proveedor_id, fecha_inicio, fecha_fin } = req.query;
  
    try {
      let query = `
        SELECT c.*, p.nombre AS proveedor 
        FROM compras c
        JOIN proveedores p ON c.proveedor_id = p.id
        WHERE 1=1
      `;
      const params = [];
  
      if (proveedor_id) {
        query += ' AND c.proveedor_id = ?';
        params.push(proveedor_id);
      }
      if (fecha_inicio && fecha_fin) {
        query += ' AND c.fecha BETWEEN ? AND ?';
        params.push(fecha_inicio, fecha_fin);
      }
  
      const [compras] = await pool.query(query, params);
      res.json({ success: true, data: compras });
    } catch (error) {
      console.error('Error al obtener histórico de compras:', error);
      res.status(500).json({ success: false, message: 'Error al obtener histórico de compras' });
    }
  });
  

// Análisis de costos vs precios de venta
reportesRouter.get('/analisis-costos-precios', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { producto_id, fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT 
        p.nombre AS producto, 
        SUM(dv.cantidad) AS cantidad_vendida, 
        AVG(dv.precio_unitario) AS precio_promedio_venta, 
        AVG(dc.costo_unitario) AS costo_promedio_compra, 
        (AVG(dv.precio_unitario) - AVG(dc.costo_unitario)) AS margen_promedio 
      FROM ventas v
      JOIN detalles_venta dv ON v.id = dv.venta_id
      JOIN productos p ON dv.producto_id = p.id
      JOIN detalle_compras dc ON p.id = dc.producto_id
      WHERE 1=1
    `;
    const params = [];

    if (producto_id) {
      query += ' AND p.id = ?';
      params.push(producto_id);
    }
    if (fecha_inicio && fecha_fin) {
      query += ' AND v.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }

    query += ' GROUP BY p.id';

    const [result] = await pool.query(query, params);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error al obtener análisis de costos vs precios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener análisis de costos vs precios' });
  }
});

export default reportesRouter;