import { Request, Response } from 'express';
import pool from '../../infrastructure/database/db';
import { authenticate } from '../../infrastructure/middlewares/authMiddleware';

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
      (codigo_orden, proveedor_id, moneda, tasa_cambio, fecha_esperada, total, estado) 
      VALUES (?, ?, ?, ?, ?, 0, 'pendiente')`,
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

// Nueva ruta para marcar la compra como "recibida" y actualizar el stock
comprasRouter.put('/:id/recibida', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const compraId = req.params.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verificar estado de la compra
    const [compra]: any[] = await conn.query(
      `SELECT estado FROM compras WHERE id = ?`,
      [compraId]
    );

    if (compra.length === 0) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    if (compra[0].estado === 'recibida') {
      return res.status(400).json({ message: 'La compra ya está marcada como recibida' });
    }

    // 2. Actualizar estado de la compra
    await conn.query(
      `UPDATE compras SET estado = 'recibida' WHERE id = ?`,
      [compraId]
    );

    // 3. Actualizar inventario
    const [detalles]: any[] = await conn.query(
      `SELECT variante_id, cantidad FROM detalle_compras WHERE compra_id = ?`,
      [compraId]
    );

    for (const detalle of detalles) {
      await conn.query(
        `UPDATE inventario 
        SET cantidad = cantidad + ? 
        WHERE producto_id = ?`,
        [detalle.cantidad, detalle.variante_id]
      );

      await conn.query(
        `INSERT INTO movimientos_inventario 
        (producto_id, cantidad, tipo, canal, motivo) 
        VALUES (?, ?, 'entrada', 'fisico', 'Compra recibida')`,
        [detalle.variante_id, detalle.cantidad]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Error al marcar compra como recibida' });
  } finally {
    conn.release();
  }
});

export default comprasRouter;