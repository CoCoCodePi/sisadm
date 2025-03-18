import { Request, Response } from 'express';
import pool from '../db';

const metodosRouter = require('express').Router();

// Obtener todos los métodos activos
metodosRouter.get('/', async (req: Request, res: Response) => {
  try {
    const [metodos] = await pool.query(
      `SELECT id, nombre 
      FROM metodos_pago 
      WHERE habilitado = TRUE`
    );
    res.json({ success: true, data: metodos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener métodos' });
  }
});

// Crear nuevo método (solo admin/maestro)
metodosRouter.post('/', async (req: Request, res: Response) => {
  const { nombre } = req.body;
  
  try {
    const [result]: any[] = await pool.query(
      `INSERT INTO metodos_pago (nombre) VALUES (?)`,
      [nombre]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Este método ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear método' });
  }
});

export default metodosRouter;