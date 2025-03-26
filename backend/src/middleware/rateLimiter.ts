import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 10000, // 15 minutos
  max: 1000, // Limitar a 100 solicitudes por ventana por IP
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos'
});