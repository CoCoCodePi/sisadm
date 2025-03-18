import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { generarFacturaPDF, generarFacturaXML } from '../services/facturacion';

const ventasRouter = require('express').Router();

// Tipos TypeScript
interface DetalleVenta {
  variante_id: number;
  cantidad: number;
  precio_unitario: number;
}

interface Pago {
  monto: number;
  metodo: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';
  referencia?: string;
}

interface VentaBody {
  cliente_id?: number;
  detalles: DetalleVenta[];
  pagos: Pago[];
  moneda: 'USD' | 'VES';
  tasa_cambio: number;
  canal: 'fisico' | 'online';
}

// Generar código de venta único
const generarCodigoVenta = (): string => {
  const fecha = new Date();
  return `VEN-${fecha.getFullYear()}${(fecha.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// Registrar nueva venta
ventasRouter.post('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
  const body: VentaBody = req.body;
  const usuarioId = req.user!.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Validar stock y precios
    for (const detalle of body.detalles) { 
        const [stock]: any[] = await conn.query(
          `SELECT disponible FROM stock_disponible WHERE variante_id = ?`,
          [detalle.variante_id]
        );
        
        if (stock[0].disponible < detalle.cantidad) {
          throw new Error(`Stock insuficiente para variante ID: ${detalle.variante_id}`);
        }
      }

    // 2. Crear venta
    const codigoVenta = generarCodigoVenta();
    const [ventaResult]: any[] = await conn.query(
      `INSERT INTO ventas 
      (codigo_venta, cliente_id, usuario_id, total, moneda, tasa_cambio, canal)
      VALUES (?, ?, ?, 0, ?, ?, ?)`, // Total calculado después
      [codigoVenta, body.cliente_id, usuarioId, body.moneda, body.tasa_cambio, body.canal]
    );
    const ventaId = ventaResult.insertId;

    // 3. Insertar detalles y calcular total
    let totalVenta = 0;
    for (const detalle of body.detalles) {
      await conn.query(
        `INSERT INTO detalles_venta 
        (venta_id, variante_id, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?)`,
        [ventaId, detalle.variante_id, detalle.cantidad, detalle.precio_unitario]
      );

      totalVenta += detalle.cantidad * detalle.precio_unitario;

      // Actualizar inventario
      await conn.query(
        `UPDATE inventario i
        INNER JOIN variantes v ON i.producto_id = v.producto_id
        SET i.cantidad = GREATEST(i.cantidad - ?, 0)  -- Evita valores negativos
        WHERE v.id = ?`,
        [detalle.cantidad, detalle.variante_id]
      );
    }

    // 4. Actualizar total en venta
    await conn.query(
      `UPDATE ventas SET total = ? WHERE id = ?`,
      [totalVenta, ventaId]
    );

    // 5. Registrar pagos
    for (const pago of body.pagos) {
        await conn.query(
          `INSERT INTO pagos 
          (venta_id, moneda_base, tasa_base) 
          VALUES (?, ?, ?)`,
          [ventaId, body.moneda, body.tasa_cambio]
        );
      }

    // 6. Registrar comisión
    const porcentajeComision = 5.0; // 5% por defecto
    await conn.query(
      `INSERT INTO comisiones 
      (venta_id, usuario_id, monto, porcentaje)
      VALUES (?, ?, ?, ?)`,
      [ventaId, usuarioId, (totalVenta * porcentajeComision) / 100, porcentajeComision]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      data: { codigo_venta: codigoVenta, venta_id: ventaId }
    });

  } catch (error: any) {
    await conn.rollback();
  
    // 1. Error de constraint de MySQL
    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      return res.status(400).json({
        success: false,
        message: 'Error crítico: Stock no puede ser negativo. Verifique la integridad de los datos.'
      });
    }
  
    // 2. Error de stock insuficiente
    if (error.message.startsWith('Stock insuficiente')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  
    // 3. Error de validación de datos
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }
  
    // 4. Error genérico
    console.error('Error en venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar la venta'
    });
    
  } finally {
    conn.release();
  }
});

// Obtener listado de ventas
ventasRouter.get('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
  const { canal, estado, fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT v.*, c.nombre AS cliente, u.email AS vendedor 
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      INNER JOIN usuarios u ON v.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (canal) {
      query += ' AND v.canal = ?';
      params.push(canal);
    }
    if (estado) {
      query += ' AND v.estado = ?';
      params.push(estado);
    }
    if (fecha_inicio && fecha_fin) {
      query += ' AND v.creado_en BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }

    const [ventas] = await pool.query(query, params);
    res.json({ success: true, data: ventas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener ventas' });
  }
});

// Cancelar venta
ventasRouter.patch('/:id/cancelar', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const ventaId = req.params.id;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Verificar estado actual
    const [venta]: any[] = await conn.query(
      `SELECT estado FROM ventas WHERE id = ? FOR UPDATE`,
      [ventaId]
    );

    if (venta[0].estado === 'cancelada') {
      return res.status(400).json({ message: 'La venta ya está cancelada' });
    }

    // 2. Revertir inventario
    const [detalles]: any[] = await conn.query(
      `SELECT dv.variante_id, dv.cantidad 
      FROM detalles_venta dv
      WHERE dv.venta_id = ?`,
      [ventaId]
    );

    for (const detalle of detalles) {
      await conn.query(
        `UPDATE inventario i
        INNER JOIN variantes v ON i.producto_id = v.producto_id
        SET i.cantidad = i.cantidad + ?
        WHERE v.id = ?`,
        [detalle.cantidad, detalle.variante_id]
      );
    }

    // 3. Actualizar estado
    await conn.query(
      `UPDATE ventas SET estado = 'cancelada' WHERE id = ?`,
      [ventaId]
    );

    await conn.commit();
    res.json({ success: true, message: 'Venta cancelada correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al cancelar venta' });
  } finally {
    conn.release();
  }
});

// Generar factura en PDF
ventasRouter.get('/:id/factura', authenticate(['vendedor', 'admin']), async (req: Request, res: Response) => {
  try {
    const pdf = await generarFacturaPDF(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar factura' });
  }
});

export default ventasRouter;