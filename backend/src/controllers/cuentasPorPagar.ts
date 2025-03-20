import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { audit } from '../middleware/auditMiddleware';
import { validateProveedor } from '../middleware/validationMiddleware';
import { generarReporteCuentasPorPagar } from '../services/reportes';

const cuentasPorPagarRouter = require('express').Router();

// Crear un nuevo proveedor
cuentasPorPagarRouter.post('/proveedores', authenticate(['admin', 'maestro']), validateProveedor, audit('Crear Proveedor'), async (req: Request, res: Response) => {
  const { nombre, contacto, telefono, direccion, termino_pago } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO proveedores (nombre, contacto, telefono, direccion, termino_pago) VALUES (?, ?, ?, ?, ?)`,
      [nombre, contacto, telefono, direccion, termino_pago]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear el proveedor' });
  }
});

// Obtener todos los proveedores
cuentasPorPagarRouter.get('/proveedores', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [proveedores]: any[] = await pool.query(`SELECT * FROM proveedores`);
    res.json({ success: true, data: proveedores });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
  }
});

// Crear una nueva compra
cuentasPorPagarRouter.post('/compras', authenticate(['admin', 'maestro']), audit('Crear Compra'), async (req: Request, res: Response) => {
  const { proveedor_id, fecha, monto, productos, condiciones_pago } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO compras (proveedor_id, fecha, monto, productos, condiciones_pago) VALUES (?, ?, ?, ?, ?)`,
      [proveedor_id, fecha, monto, productos, condiciones_pago]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear la compra' });
  }
});

// Obtener todas las compras
cuentasPorPagarRouter.get('/compras', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [compras]: any[] = await pool.query(`SELECT * FROM compras`);
    res.json({ success: true, data: compras });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ success: false, message: 'Error al obtener compras' });
  }
});

// Crear un nuevo pago
cuentasPorPagarRouter.post('/pagos', authenticate(['admin', 'maestro']), audit('Crear Pago'), async (req: Request, res: Response) => {
  const { compra_id, fecha_pago, monto, metodo_pago, moneda } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO pagos (compra_id, fecha_pago, monto, metodo_pago, moneda) VALUES (?, ?, ?, ?, ?)`,
      [compra_id, fecha_pago, monto, metodo_pago, moneda]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear el pago' });
  }
});

// Obtener todos los pagos
cuentasPorPagarRouter.get('/pagos', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [pagos]: any[] = await pool.query(`SELECT * FROM pagos`);
    res.json({ success: true, data: pagos });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pagos' });
  }
});

// Generar reporte de cuentas por pagar
cuentasPorPagarRouter.get('/reporte', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await generarReporteCuentasPorPagar();

    res.setHeader('Content-Disposition', 'attachment; filename="reporte_cuentas_por_pagar.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar reporte de cuentas por pagar:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar el reporte de cuentas por pagar' });
  }
});

export default cuentasPorPagarRouter;