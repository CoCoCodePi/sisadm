import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

export const authenticate = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Acceso no autorizado' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        email: string;
        rol: 'admin' | 'operador' | 'vendedor' | 'maestro';
      };

      const [users] = await pool.query(
        'SELECT id, email, rol FROM usuarios WHERE id = ?',
        [decoded.id]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(401).json({ message: 'Usuario no existe' });
      }

      const user = users[0] as any;

      if (!roles.includes(user.rol)) {
        return res.status(403).json({ message: 'Permisos insuficientes' });
      }

      // Asignación correcta con tipado
      req.user = {
        id: user.id,
        email: user.email,
        rol: user.rol
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};