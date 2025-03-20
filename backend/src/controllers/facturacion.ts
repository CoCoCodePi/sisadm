import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { generarFacturaPDF, enviarFacturaPorCorreo } from '../services/facturacion';

const facturacionRouter = require('express').Router();

// Tipos TypeScript
interface FacturaBody {
  venta_id: number;
  cliente_id: number;
  total: number;
  impuestos: number;
  estado: 'emitida' | 'pagada' | 'cancelada';
}

// Generar código de factura único
const generarCodigoFactura = (): string => {
  const fecha = new Date();
  return `FAC-${fecha.getFullYear()}${(fecha.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

// Crear nueva factura
facturacionRouter.post('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
  const body: FacturaBody = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear factura
    const codigoFactura = generarCodigoFactura();
    const [facturaResult]: any[] = await conn.query(
      `INSERT INTO facturas 
      (codigo_factura, venta_id, cliente_id, total, impuestos, estado)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [codigoFactura, body.venta_id, body.cliente_id, body.total, body.impuestos, body.estado]
    );
    const facturaId = facturaResult.insertId;

    await conn.commit();

    // 2. Generar PDF de la factura
    const pdf = await generarFacturaPDF(facturaId);

    // 3. Enviar factura por correo electrónico (opcional)
    await enviarFacturaPorCorreo(body.cliente_id, codigoFactura, pdf);

    res.status(201).json({
      success: true,
      data: { codigo_factura: codigoFactura, factura_id: facturaId }
    });

  } catch (error: any) {
    await conn.rollback();

    // Manejo de errores
    console.error('Error en facturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al procesar la facturación'
    });
  } finally {
    conn.release();
  }
});

// Obtener listado de facturas
facturacionRouter.get('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
  const { estado, fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT f.*, c.nombre AS cliente
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      query += ' AND f.estado = ?';
      params.push(estado);
    }
    if (fecha_inicio && fecha_fin) {
      query += ' AND f.fecha_emision BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }

    const [facturas] = await pool.query(query, params);
    res.json({ success: true, data: facturas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener facturas' });
  }
});

// Editar factura
facturacionRouter.patch('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const facturaId = req.params.id;
  const { estado, total, impuestos } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `UPDATE facturas 
      SET estado = ?, total = ?, impuestos = ? 
      WHERE id = ?`,
      [estado, total, impuestos, facturaId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    res.json({ success: true, message: 'Factura actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar factura' });
  }
});

// Eliminar factura
facturacionRouter.delete('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const facturaId = req.params.id;

  try {
    const [result]: any[] = await pool.query(
      `DELETE FROM facturas 
      WHERE id = ?`,
      [facturaId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    res.json({ success: true, message: 'Factura eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar factura' });
  }
});

export default facturacionRouter;