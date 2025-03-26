import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

// Tipos TypeScript
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
  product: string;
  current: number;
  min: number;
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
    const [todaySales] = await pool.query<SalesResult[]>(
      `SELECT SUM(dv.precio_unitario * dv.cantidad / dv.tasa_cambio) as total
       FROM ventas v
       JOIN detalles_venta dv ON v.id = dv.venta_id
       WHERE DATE(v.creado_en) = CURDATE()`
    );

    const [weekSales] = await pool.query<WeekSalesResult[]>(
      `SELECT SUM(dv.precio_unitario * dv.cantidad / dv.tasa_cambio) as total, DAYOFWEEK(v.creado_en) as day
       FROM ventas v
       JOIN detalles_venta dv ON v.id = dv.venta_id
       WHERE YEARWEEK(v.creado_en, 1) = YEARWEEK(CURDATE(), 1)
       GROUP BY DAYOFWEEK(v.creado_en)`
    );

    const [monthSales] = await pool.query<MonthSalesResult[]>(
      `SELECT c.nombre as category, SUM(dv.precio_unitario * dv.cantidad / dv.tasa_cambio) as total
       FROM detalles_venta dv
       JOIN variantes v ON dv.variante_id = v.id
       JOIN productos p ON v.producto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       JOIN ventas ve ON dv.venta_id = ve.id
       WHERE MONTH(ve.creado_en) = MONTH(CURDATE())
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
    const [totalProducts] = await pool.query<InventoryResult[]>(
      'SELECT COUNT(*) as count FROM productos'
    );

    const [lowStockProducts] = await pool.query<LowStockResult[]>(
      `SELECT p.nombre as product, i.cantidad as current, i.minimo as min
       FROM inventario i
       JOIN variantes v ON i.variante_id = v.id
       JOIN productos p ON v.producto_id = p.id
       WHERE i.cantidad < i.minimo`
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

// Obtener datos de clientes para el dashboard
dashboardRouter.get('/clients', async (req: Request, res: Response) => {
  try {
    const [todayClients] = await pool.query<ClientsResult[]>(
      'SELECT COUNT(*) as count FROM clientes WHERE DATE(creado_en) = CURDATE()'
    );

    const [pendingPayments] = await pool.query<PendingPaymentsResult[]>(
      `SELECT COUNT(*) as count
       FROM cuentas_por_pagar
       WHERE estado = 'pendiente'`
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