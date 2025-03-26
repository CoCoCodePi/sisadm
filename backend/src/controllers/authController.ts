import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { RowDataPacket } from 'mysql2';

const authRouter = require('express').Router();

// Tipos TypeScript
interface UserResult extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  rol: string;
}

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan campos requeridos: email, password' });
  }

  try {
    const [users] = await pool.query<UserResult[]>(
      'SELECT id, email, password_hash, rol FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    
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

    res.json({ success: true, token, rol: user.rol });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error en el login', error: error.message });
    } else {
      res.status(500).json({ message: 'Error en el login' });
    }
  }
});

// Registro de usuario
authRouter.post('/register', authenticate(['maestro']), async (req: Request, res: Response) => {
  const { email, password, name, rol } = req.body;

  if (!email || !password || !name || !rol) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, rol]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    } else {
      res.status(500).json({ message: 'Error al registrar usuario' });
    }
  }
});

// Verificar email
authRouter.get('/check-email', async (req: Request, res: Response) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email es requerido' });
  }

  try {
    const [users] = await pool.query<UserResult[]>(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    res.status(200).json({ message: 'Email disponible' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error al verificar email', error: error.message });
    } else {
      res.status(500).json({ message: 'Error al verificar email' });
    }
  }
});

// Actualizar usuario
authRouter.put('/update', authenticate(['maestro']), async (req: Request, res: Response) => {
  const { email, password, ...rest } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email es requerido' });
  }

  try {
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE usuarios SET ? WHERE email = ?',
        [{ ...rest, password_hash: passwordHash }, email]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET ? WHERE email = ?',
        [rest, email]
      );
    }

    const [updatedUser] = await pool.query<UserResult[]>(
      'SELECT id, email, nombre, rol FROM usuarios WHERE email = ?',
      [email]
    );

    res.status(200).json({ updatedUser: updatedUser[0], message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
    } else {
      res.status(500).json({ message: 'Error al actualizar usuario' });
    }
  }
});

// Eliminar usuario
authRouter.delete('/delete', authenticate(['maestro']), async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email es requerido' });
  }

  try {
    await pool.query('DELETE FROM usuarios WHERE email = ?', [email]);

    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
    } else {
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  }
});

// Obtener todos los usuarios (solo para el rol 'maestro')
authRouter.get('/users', authenticate(['maestro']), async (req: Request, res: Response) => {
  try {
    const [users] = await pool.query<UserResult[]>(
      'SELECT id, email, nombre, rol FROM usuarios'
    );

    res.json(users);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    } else {
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  }
});

// Verificar token
authRouter.get('/verify', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      rol: string;
    };

    const [users] = await pool.query<UserResult[]>(
      'SELECT id, email, nombre, rol FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ valid: true, user: users[0] });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

export default authRouter;