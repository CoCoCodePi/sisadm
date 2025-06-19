import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

// --- Interfaces de Tipos (sin cambios) ---
interface SalesResult extends RowDataPacket {
  total: number;
}
interface WeekSalesResult extends RowDataPacket {
  total: number;
  day: number;
}
interface MonthSalesResult extends RowDataPacket {
  category: string;
  total: number;
}
interface InventoryResult extends RowDataPacket {
  count: number;
}
interface LowStockResult extends RowDataPacket {
  producto_nombre: string;
  variante_nombre: string;
  stock_total: number;
  minimo: number;
}
interface ClientsResult extends RowDataPacket {
  count: number;
}
interface PendingPaymentsResult extends RowDataPacket {
  count: number;
}

const dashboardRouter = require('express').Router();

// Obtener datos de ventas para el dashboard
dashboardRouter.get('/sales', async (req: Request, res: Response) => {
  try {
    // --- CORREGIDO: Se usa v.creado_en en lugar de una columna de fecha inexistente ---
    const [todaySales] = await pool.query<SalesResult[]>(
      `SELECT SUM(total_venta) as total
       FROM ventas v
       WHERE DATE(v.creado_en) = CURDATE()`
    );

    const [weekSales] = await pool.query<WeekSalesResult[]>(
      `SELECT SUM(total_venta) as total, DAYOFWEEK(v.creado_en) as day
       FROM ventas v
       WHERE YEARWEEK(v.creado_en, 1) = YEARWEEK(CURDATE(), 1)
       GROUP BY DAYOFWEEK(v.creado_en)`
    );

    const [monthSales] = await pool.query<MonthSalesResult[]>(
      `SELECT c.nombre as category, SUM(dv.cantidad * dv.precio_unitario) as total
       FROM detalles_venta dv
       JOIN variantes v ON dv.variante_id = v.id
       JOIN productos p ON v.producto_id = p.id
       JOIN categorias c ON p.categoria_principal_id = c.id
       JOIN ventas ve ON dv.venta_id = ve.id
       WHERE MONTH(ve.creado_en) = MONTH(CURDATE()) AND YEAR(ve.creado_en) = YEAR(CURDATE())
       GROUP BY c.nombre`
    );

    res.json({
      today: todaySales[0]?.total || 0,
      week: Array.from({ length: 7 }, (_, i) => weekSales.find((s) => s.day === i + 1)?.total || 0),
      month: {
        categories: monthSales.map((s) => s.category),
        data: monthSales.map((s) => s.total)
      }
    });
  } catch (error) {
    console.error('Error al obtener datos de ventas:', error);
    res.status(500).json({ message: 'Error al obtener datos de ventas' });
  }
});

// Obtener datos de inventario para el dashboard
dashboardRouter.get('/inventory', async (req: Request, res: Response) => {
  try {
    // --- CORREGIDO: La consulta ahora usa la tabla 'productos' para el conteo total ---
    const [totalProducts] = await pool.query<InventoryResult[]>(
      'SELECT COUNT(*) as count FROM productos WHERE estado = "activo"'
    );

    // --- CORREGIDO: La consulta de bajo stock ahora usa la nueva vista de inventario ---
    const [lowStockProducts] = await pool.query<LowStockResult[]>(
      `SELECT 
          p.nombre as producto_nombre,
          v.nombre as variante_nombre,
          SUM(li.cantidad) as stock_total,
          li.minimo
       FROM lotes_inventario li
       JOIN variantes v ON li.variante_id = v.id
       JOIN productos p ON v.producto_id = p.id
       GROUP BY v.id, p.id, li.minimo
       HAVING SUM(li.cantidad) < li.minimo`
    );

    res.json({
      totalProducts: totalProducts[0]?.count || 0,
      lowStock: lowStockProducts
    });
  } catch (error) {
    console.error('Error al obtener datos de inventario:', error);
    res.status(500).json({ message: 'Error al obtener datos de inventario' });
  }
});

// Obtener datos de clientes y cuentas por pagar para el dashboard
dashboardRouter.get('/clients', async (req: Request, res: Response) => {
  try {
    // --- CORREGIDO: Se usa creado_en para los clientes del día ---
    const [todayClients] = await pool.query<ClientsResult[]>(
      'SELECT COUNT(*) as count FROM clientes WHERE DATE(creado_en) = CURDATE()'
    );

    const [pendingPayments] = await pool.query<PendingPaymentsResult[]>(
      `SELECT COUNT(*) as count
       FROM cuentas_por_pagar
       WHERE estado = 'pendiente' OR estado = 'vencida' OR estado = 'abonada'`
    );

    res.json({
      today: todayClients[0]?.count || 0,
      pendingPayments: pendingPayments[0]?.count || 0
    });
  } catch (error) {
    console.error('Error al obtener datos de clientes:', error);
    res.status(500).json({ message: 'Error al obtener datos de clientes' });
  }
});

export default dashboardRouter;