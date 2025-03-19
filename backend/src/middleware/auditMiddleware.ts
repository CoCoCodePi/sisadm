import { Request, Response, NextFunction } from 'express';
import pool from '../db';

export const audit = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const { method, originalUrl, body } = req;

    if (!user) {
      console.error('User is not authenticated');
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, method, url, body) VALUES (?, ?, ?, ?, ?)`,
        [user.id, action, method, originalUrl, JSON.stringify(body)]
      );
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
    }

    next();
  };
};