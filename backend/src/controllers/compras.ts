import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const comprasRouter = require('express').Router();

interface DetalleCompra {
  variante_id: number;
  cantidad: number;
  costo_unitario: number;
}

interface CompraBody {
  proveedor_id: number;
  detalles: DetalleCompra[];
  moneda: 'USD' | 'VES';
  tasa_cambio: number;
  fecha_esperada: string;
}

comprasRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const body: CompraBody = req.body;
  const codigoOrden = `COMP-${Date.now().toString(36).toUpperCase()}`;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear compra
    const [compraResult]: any[] = await conn.query(
      `INSERT INTO compras 
      (codigo_orden, proveedor_id, moneda, tasa_cambio, fecha_esperada, total) 
      VALUES (?, ?, ?, ?, ?, 0)`,
      [codigoOrden, body.proveedor_id, body.moneda, body.tasa_cambio, body.fecha_esperada]
    );
    const compraId = compraResult.insertId;

    // 2. Procesar detalles
    let totalCompra = 0;
    for (const detalle of body.detalles) {
      const costoUSD = body.moneda === 'USD' 
        ? detalle.costo_unitario 
        : detalle.costo_unitario / body.tasa_cambio;

      await conn.query(
        `INSERT INTO detalle_compras 
        (compra_id, variante_id, cantidad, costo_unitario) 
        VALUES (?, ?, ?, ?)`,
        [compraId, detalle.variante_id, detalle.cantidad, detalle.costo_unitario]
      );

      totalCompra += detalle.cantidad * costoUSD;
    }

    // 3. Actualizar total compra
    await conn.query(
      `UPDATE compras SET total = ? WHERE id = ?`,
      [totalCompra, compraId]
    );

    // 4. Crear cuenta por pagar
    await conn.query(
      `INSERT INTO cuentas_por_pagar 
      (compra_id, monto_original, monto_pendiente, fecha_vencimiento) 
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL (SELECT dias_credito FROM proveedores WHERE id = ?) DAY))`,
      [compraId, totalCompra, totalCompra, body.proveedor_id]
    );

    await conn.commit();
    res.status(201).json({ compra_id: compraId, codigo_orden: codigoOrden });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Error al registrar compra' });
  } finally {
    conn.release();
  }
});

export default comprasRouter;