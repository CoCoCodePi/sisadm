import { Request, Response } from 'express';
import pool from '../../infrastructure/database/db';
import { authenticate } from '../../infrastructure/middlewares/authMiddleware';

const proveedoresRouter = require('express').Router();

// Validar formato RIF (Ej: J-123456789)
const validarRIF = (rif: string): boolean => {
  return /^[JVDG]{1}-?\d{8}-?\d$/.test(rif.toUpperCase());
};

// Crear proveedor
proveedoresRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { nombre, rif, telefono, direccion, contacto_nombre, email, dias_credito } = req.body;
  
  if (!validarRIF(rif)) {
    return res.status(400).json({ message: 'Formato RIF inválido' });
  }

  if (!/^\d{10}$/.test(telefono)) {
    return res.status(400).json({ message: 'Formato de teléfono inválido' });
  }

  if (email && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
    return res.status(400).json({ message: 'Formato de email inválido' });
  }

  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO proveedores 
      (nombre, rif, telefono, direccion, contacto_nombre, email, dias_credito) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, rif.replace(/-/g, ''), telefono, direccion, contacto_nombre, email, dias_credito]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ER_DUP_ENTRY')) {
        return res.status(400).json({ message: 'RIF ya registrado' });
      }
      res.status(500).json({ message: 'Error al crear proveedor', error: error.message });
    } else {
      res.status(500).json({ message: 'Error desconocido al crear proveedor' });
    }
  }
});

// Obtener todos los proveedores
proveedoresRouter.get('/', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
  const { search, page = 1, limit = 10, sort = 'nombre', order = 'ASC' } = req.query;
  
  let query = `SELECT * FROM proveedores`;
  const params = [];
  
  if (search) {
    query += ` WHERE nombre LIKE ? OR rif LIKE ?`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

  try {
    const [proveedores] = await pool.query(query, params);
    res.json(proveedores);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error al obtener proveedores', error: error.message });
    } else {
      res.status(500).json({ message: 'Error desconocido al obtener proveedores' });
    }
  }
});

export default proveedoresRouter;