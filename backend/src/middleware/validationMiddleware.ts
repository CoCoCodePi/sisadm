import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateProveedor = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('contacto').isEmail().withMessage('El contacto debe ser un correo electrónico válido'),
  body('telefono').isMobilePhone('any').withMessage('El teléfono debe ser un número de teléfono válido'),
  body('direccion').notEmpty().withMessage('La dirección es obligatoria'),
  body('termino_pago').notEmpty().withMessage('El término de pago es obligatorio'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];