import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const tasasRouter = require('express').Router();

// GET /api/tasas/actual - Obtener la tasa de cambio más reciente DESDE NUESTRA BD
tasasRouter.get('/actual', authenticate(['admin', 'maestro', 'vendedor']), async (req: Request, res: Response) => {
    try {
        const [tasas] = await pool.query<RowDataPacket[]>(
            "SELECT tasa_usd FROM historico_tasas ORDER BY fecha DESC LIMIT 1"
        );

        if (tasas.length === 0) {
            // Si no hay ninguna tasa en el historial, devolvemos 0 para que el frontend lo indique.
            return res.json({ success: true, data: { tasa: 0 } });
        }

        res.json({ success: true, data: { tasa: tasas[0].tasa_usd } });
    } catch (error) {
        console.error("--- ERROR EN GET /api/tasas/actual ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener la tasa de cambio.' });
    }
});

// GET /api/tasas - Obtener el historial de tasas
tasasRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    try {
        const [tasas] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM historico_tasas ORDER BY fecha DESC LIMIT 100"
        );
        res.json({ success: true, data: tasas });
    } catch (error) {
        console.error("--- ERROR EN GET /api/tasas ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener el historial de tasas.' });
    }
});

// POST /api/tasas - Guardar la tasa para una fecha específica
tasasRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { fecha, tasa_usd } = req.body;

    if (!fecha || !tasa_usd || Number(tasa_usd) <= 0) {
        return res.status(400).json({ success: false, message: 'La fecha y una tasa válida son requeridas.' });
    }
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // Eliminar cualquier tasa existente para esa fecha para evitar duplicados
        await conn.query("DELETE FROM historico_tasas WHERE DATE(fecha) = ?", [fecha]);
        // Insertar la nueva tasa
        await conn.query<ResultSetHeader>(
            "INSERT INTO historico_tasas (fecha, tasa_usd, fuente) VALUES (?, ?, ?)",
            [fecha, tasa_usd, 'Manual']
        );
        await conn.commit();
        res.status(201).json({ success: true, message: 'Tasa guardada exitosamente.' });
    } catch (error) {
        await conn.rollback();
        console.error("--- ERROR EN POST /api/tasas ---", error);
        res.status(500).json({ success: false, message: 'Error al guardar la tasa.' });
    } finally {
        conn.release();
    }
});

export default tasasRouter;