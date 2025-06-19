import { Express } from 'express-serve-static-core';
import * as multer from "multer";
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        rol: 'admin' | 'operador' | 'vendedor' | 'maestro';
        files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
      };
    }
  }
}