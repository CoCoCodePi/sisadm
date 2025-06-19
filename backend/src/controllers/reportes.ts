import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket } from 'mysql2';

const reportesRouter = require('express').Router();

// Interfaz para los filtros del reporte de ventas
interface FiltrosVentas {
    fechaInicio: string;
    fechaFin: string;
    clientesIDs?: number[];
    vendedoresIDs?: number[];
}

// Endpoint para el Reporte de Ventas Detallado
reportesRouter.post('/ventas-detallado', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { fechaInicio, fechaFin, clientesIDs, vendedoresIDs } = req.body as FiltrosVentas;

    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, message: 'Las fechas de inicio y fin son requeridas.' });
    }

    try {
        let params: (string | number | number[])[] = [fechaInicio, fechaFin];
        let whereClauses = ["DATE(v.creado_en) BETWEEN ? AND ?"];

        if (clientesIDs && clientesIDs.length > 0) {
            whereClauses.push("v.cliente_id IN (?)");
            params.push(clientesIDs);
        }

        if (vendedoresIDs && vendedoresIDs.length > 0) {
            whereClauses.push("v.usuario_id IN (?)");
            params.push(vendedoresIDs);
        }

        const whereString = `WHERE ${whereClauses.join(' AND ')}`;

        const query = `
            SELECT 
                v.id,
                v.codigo_venta,
                v.creado_en AS fecha,
                v.subtotal,
                v.total_iva,
                v.total_venta,
                v.estado,
                c.nombre AS cliente_nombre,
                u.nombre AS vendedor_nombre
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.id
            JOIN usuarios u ON v.usuario_id = u.id
            ${whereString}
            ORDER BY v.creado_en DESC;
        `;
        
        const [ventas] = await pool.query(query, params);

        // Calcular totales para el resumen
        const totales = (ventas as RowDataPacket[]).reduce((acc, venta) => {
            acc.subtotal += Number(venta.subtotal);
            acc.iva += Number(venta.total_iva);
            acc.total += Number(venta.total_venta);
            return acc;
        }, { subtotal: 0, iva: 0, total: 0, cantidad: (ventas as RowDataPacket[]).length });

        res.json({ success: true, data: { ventas, totales } });

    } catch (error) {
        console.error("Error generando reporte de ventas:", error);
        res.status(500).json({ success: false, message: 'Error en el servidor al generar el reporte.' });
    }
});

// --- AÑADIDO: Endpoint para Reporte de Inventario ---
reportesRouter.get('/inventario-valorizado', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
      const query = `
          SELECT 
              p.nombre AS producto_nombre,
              v.nombre AS variante_nombre,
              v.costo_promedio,
              SUM(li.cantidad) AS stock_actual,
              (v.costo_promedio * SUM(li.cantidad)) AS valor_total
          FROM lotes_inventario li
          JOIN variantes v ON li.variante_id = v.id
          JOIN productos p ON v.producto_id = p.id
          WHERE li.cantidad > 0
          GROUP BY v.id
          ORDER BY p.nombre, v.nombre;
      `;
      const [inventario] = await pool.query(query);
      const valorTotalInventario = (inventario as RowDataPacket[]).reduce((sum, item) => sum + Number(item.valor_total), 0);

      res.json({ success: true, data: { inventario, valorTotalInventario } });
  } catch (error) {
      console.error("Error generando reporte de inventario:", error);
      res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
});

// --- AÑADIDO: Endpoint para Reporte de Productos Más Vendidos ---
reportesRouter.post('/mas-vendidos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.body;

  if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ success: false, message: 'Las fechas de inicio y fin son requeridas.' });
  }

  try {
      const query = `
          SELECT 
              p.nombre AS producto_nombre,
              v.nombre AS variante_nombre,
              SUM(dv.cantidad) AS total_unidades_vendidas,
              SUM(dv.cantidad * dv.precio_unitario) AS total_ingresos_generados
          FROM detalles_venta dv
          JOIN ventas ven ON dv.venta_id = ven.id
          JOIN variantes v ON dv.variante_id = v.id
          JOIN productos p ON v.producto_id = p.id
          WHERE DATE(ven.creado_en) BETWEEN ? AND ?
          GROUP BY v.id, p.id
          ORDER BY total_unidades_vendidas DESC
          LIMIT 50;
      `;
      const [productos] = await pool.query(query, [fechaInicio, fechaFin]);
      res.json({ success: true, data: productos });
  } catch (error) {
      console.error("Error generando reporte de más vendidos:", error);
      res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
});

export default reportesRouter;