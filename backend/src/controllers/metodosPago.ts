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

// Editar método de pago (solo admin/maestro)
metodosRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, habilitado } = req.body;

  try {
    const [result]: any[] = await pool.query(
      `UPDATE metodos_pago SET nombre = ?, habilitado = ? WHERE id = ?`,
      [nombre, habilitado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Método no encontrado' });
    }

    res.json({ success: true, message: 'Método actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar método' });
  }
});

// Eliminar método de pago (solo admin/maestro)
metodosRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [result]: any[] = await pool.query(
      `DELETE FROM metodos_pago WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Método no encontrado' });
    }

    res.json({ success: true, message: 'Método eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar método' });
  }
});

export default metodosRouter;