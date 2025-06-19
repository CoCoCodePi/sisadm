import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const proveedoresRouter = require('express').Router();

// --- Función de Validación ---
const validarProveedor = (data: any) => {
  const { nombre, rif, telefono, email } = data;
  const errors = [];

  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre es requerido.');
  }
  if (!rif || !/^J-\d{8,9}$/.test(rif)) {
    errors.push('El RIF debe tener el formato J-xxxxxxxx y 8 o 9 dígitos.');
  }
  if (telefono && !/^\d{11}$/.test(telefono)) {
      errors.push('El teléfono debe ser un número de 11 dígitos.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('El formato del email no es válido.');
  }

  return errors;
}

// --- Crear Proveedor ---
proveedoresRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const validationErrors = validarProveedor(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ success: false, message: validationErrors.join(' ') });
  }

  const { nombre, rif, telefono, direccion, contacto_nombre, email, dias_credito, cuenta_bancaria } = req.body;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query<RowDataPacket[]>(
      'SELECT id FROM proveedores WHERE nombre = ? OR rif = ?',
      [nombre.trim(), rif.trim()]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'El nombre o RIF del proveedor ya existe.' });
    }

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO proveedores (nombre, rif, telefono, direccion, contacto_nombre, email, dias_credito, cuenta_bancaria) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), rif.trim(), telefono, direccion, contacto_nombre, email, dias_credito || 0, cuenta_bancaria]
    );
    
    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });

  } catch (error: any) {
    await conn.rollback();
    console.error("--- ERROR EN POST /api/proveedores ---", error);
    res.status(500).json({ success: false, message: 'Error del servidor al crear el proveedor.' });
  } finally {
    conn.release();
  }
});

// --- Actualizar Proveedor ---
proveedoresRouter.put('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const validationErrors = validarProveedor(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }

    const { id } = req.params;
    const { nombre, rif, telefono, direccion, contacto_nombre, email, dias_credito, cuenta_bancaria } = req.body;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existing] = await conn.query<RowDataPacket[]>(
            'SELECT id FROM proveedores WHERE (nombre = ? OR rif = ?) AND id != ?',
            [nombre.trim(), rif.trim(), id]
        );

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: 'El nuevo nombre o RIF ya está en uso por otro proveedor.' });
        }
        
        await conn.query(
            `UPDATE proveedores SET nombre = ?, rif = ?, telefono = ?, direccion = ?, contacto_nombre = ?, email = ?, dias_credito = ?, cuenta_bancaria = ? WHERE id = ?`,
            [nombre.trim(), rif.trim(), telefono, direccion, contacto_nombre, email, dias_credito || 0, cuenta_bancaria, id]
        );

        await conn.commit();
        res.status(200).json({ success: true, message: 'Proveedor actualizado correctamente.' });
    } catch (error: any) {
        await conn.rollback();
        console.error(`--- ERROR EN PUT /api/proveedores/${id} ---`, error);
        res.status(500).json({ success: false, message: 'Error del servidor al actualizar el proveedor.' });
    } finally {
        conn.release();
    }
});


// --- Obtener todos los proveedores con paginación y búsqueda ---
proveedoresRouter.get('/', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
  const { search = '', page = 1, limit = 10, sort = 'nombre', order = 'ASC' } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;
  
  const allowedSortFields = ['id', 'nombre', 'rif', 'dias_credito'];
  const sortField = allowedSortFields.includes(sort as string) ? sort : 'nombre';
  const sortOrder = (order as string).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  let searchQuery = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (search) {
    searchQuery += ` AND (nombre LIKE ? OR rif LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const dataQuery = `SELECT * FROM proveedores ${searchQuery} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) as total FROM proveedores ${searchQuery}`;

  try {
    const [proveedores] = await pool.query(dataQuery, [...params, limitNum, offset]);
    const [totalResult] = await pool.query<RowDataPacket[]>(countQuery, params);
    
    res.json({ 
      success: true, 
      data: proveedores, 
      total: totalResult[0].total 
    });
  } catch (error) {
    console.error("--- ERROR EN GET /api/proveedores ---", error);
    res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
  }
});


// --- Eliminar Proveedor ---
proveedoresRouter.delete('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM proveedores WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
    }
    res.status(200).json({ success: true, message: 'Proveedor eliminado' });
  } catch (error: any) {
    console.error(`--- ERROR EN DELETE /api/proveedores/${req.params.id} ---`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ success: false, message: 'No se puede eliminar. El proveedor está asociado a una o más compras o productos.' });
    }
    res.status(500).json({ success: false, message: 'Error eliminando proveedor' });
  }
});

proveedoresRouter.get('/:id', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [proveedor] = await pool.query<RowDataPacket[]>('SELECT * FROM proveedores WHERE id = ?', [id]);
    if (proveedor.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
    }
    res.json({ success: true, data: proveedor[0] });
  } catch (error) {
    console.error(`--- ERROR EN GET /api/proveedores/${id} ---`, error);
    res.status(500).json({ success: false, message: 'Error del servidor al obtener el proveedor.' });
  }
});


// --- Exportar a CSV ---
proveedoresRouter.get('/export', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    // Esta ruta puede ser implementada si se necesita, por ahora la dejamos fuera para simplificar.
    res.status(501).json({ success: false, message: 'La funcionalidad de exportar desde el backend no está implementada.' });
});

export default proveedoresRouter;