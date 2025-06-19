import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { ResultSetHeader } from 'mysql2';

const metodosPagoRouter = require('express').Router();

// GET all
metodosPagoRouter.get('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
    try {
        const [metodos] = await pool.query("SELECT * FROM metodos_pago ORDER BY nombre ASC");
        res.json({ success: true, data: metodos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// POST new
metodosPagoRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { nombre, requiere_referencia, habilitado } = req.body;
    try {
        const [result] = await pool.query<ResultSetHeader>("INSERT INTO metodos_pago (nombre, requiere_referencia, habilitado) VALUES (?, ?, ?)", [nombre, !!requiere_referencia, !!habilitado]);
        res.status(201).json({ success: true, message: "Método de pago creado.", data: { id: result.insertId, ...req.body } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// PUT update
metodosPagoRouter.put('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, requiere_referencia, habilitado } = req.body;
    try {
        await pool.query("UPDATE metodos_pago SET nombre = ?, requiere_referencia = ?, habilitado = ? WHERE id = ?", [nombre, !!requiere_referencia, !!habilitado, id]);
        res.json({ success: true, message: "Método de pago actualizado." });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

// DELETE
metodosPagoRouter.delete('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM metodos_pago WHERE id = ?", [id]);
        res.json({ success: true, message: "Método de pago eliminado." });
    } catch (error: any) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar un método de pago que ya ha sido utilizado en transacciones.' });
        }
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
});

export default metodosPagoRouter;