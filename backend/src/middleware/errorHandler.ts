import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: any;
  stack?: string;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  const response: ErrorResponse = {
    success: false,
    message: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err;
    response.stack = err.stack;
  }

  // Manejo específico de errores de JWT
  if (err.name === 'JsonWebTokenError') {
    response.message = 'Token de autenticación inválido';
    return res.status(401).json(response);
  }

  // Manejo de errores de validación
  if (err.name === 'ValidationError') {
    response.message = 'Datos de entrada inválidos';
    response.error = err.errors;
    return res.status(400).json(response);
  }

  console.error(`[ERROR] ${statusCode} - ${message}`);
  console.error(err.stack);

  res.status(statusCode).json(response);
};