import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const authRouter = require('express').Router();

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan campos requeridos: email, password' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, email, password_hash, rol FROM usuarios WHERE email = ?',
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0] as any;
    
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
        algorithm: 'HS256'
      } as jwt.SignOptions
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.COOKIE_EXPIRES_MS),
      sameSite: 'strict'
    });

    res.json({ success: true, rol: user.rol });
  } catch (error) {
    res.status(500).json({ message: 'Error en el login' });
  }
});

export default authRouter;