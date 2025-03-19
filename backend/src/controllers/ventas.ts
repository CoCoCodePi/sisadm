import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { generarFacturaPDF, enviarFacturaPorCorreo } from '../services/facturacion';

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

// Generar código de factura único
const generarCodigoFactura = (): string => {
  const fecha = new Date();
  return `FAC-${fecha.getFullYear()}${(fecha.getMonth() + 1)
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

      await conn.query(
        `INSERT INTO movimientos_inventario 
        (producto_id, cantidad, tipo, canal, motivo) 
        VALUES (?, ?, 'venta', ?, 'Venta registrada')`,
        [detalle.variante_id, detalle.cantidad, body.canal]
      );
    }

    // 4. Actualizar total en venta
    await conn.query(
      `UPDATE ventas SET total = ? WHERE id = ?`,
      [totalVenta, ventaId]
    );

    // 5. Registrar pagos y métodos de pago
    for (const pago of body.pagos) {
      const [pagoResult]: any[] = await conn.query(
        `INSERT INTO pagos 
        (venta_id, fecha, moneda_base, tasa_base) 
        VALUES (?, NOW(), ?, ?)`,
        [ventaId, body.moneda, body.tasa_cambio]
      );
      const pagoId = pagoResult.insertId;

      await conn.query(
        `INSERT INTO detalle_metodos_pago 
        (pago_id, metodo_pago_id, monto, moneda, tasa_cambio) 
        VALUES (?, (SELECT id FROM metodos_pago WHERE nombre = ?), ?, ?, ?)`,
        [pagoId, pago.metodo, pago.monto, body.moneda, body.tasa_cambio]
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

    // 7. Generar factura automáticamente
    const codigoFactura = generarCodigoFactura();
    const facturaBody = {
      venta_id: ventaId,
      cliente_id: body.cliente_id!,
      total: totalVenta,
      impuestos: totalVenta * 0.16, // Ejemplo de cálculo de impuestos (16% IVA)
      estado: 'emitida',
      codigo_factura: codigoFactura
    };
    const pdfBuffer = await generarFacturaPDF(facturaBody); // Asegurarse de obtener un Buffer

    // Enviar la factura por correo electrónico (opcional)
    await enviarFacturaPorCorreo(body.cliente_id!, codigoFactura, pdfBuffer);

    await conn.commit();

    res.status(201).json({
      success: true,
      data: { codigo_venta: codigoVenta, venta_id: ventaId, codigo_factura: codigoFactura }
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

export default ventasRouter;