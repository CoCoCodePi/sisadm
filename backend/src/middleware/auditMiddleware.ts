import { Request, Response, NextFunction } from 'express';
import pool from '../db';

export const audit = (action: string, table: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const oldData = { ...req.body }; // Capturar datos antes de cambios
      res.on('finish', async () => {
        try {
          await pool.query(
            `INSERT INTO auditoria 
            (usuario_id, accion, tabla, registro_id, datos_previos)
            VALUES (?, ?, ?, ?, ?)`,
            [req.user?.id, action, table, res.locals.lastId || 0, JSON.stringify(oldData)]
          );
        } catch (error) {
          console.error('Error en auditoría:', error);
        }
      });
      next();
    };
  };