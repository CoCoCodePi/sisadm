import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './db';
import authRouter from './controllers/authController';
import productosRouter from './controllers/productos';
import { errorHandler } from './middleware/errorHandler';
import ventasRouter from './controllers/ventas';
import pagosRouter from './controllers/pagos';
import metodosRouter from './controllers/metodosPago';
import clientesRouter from './controllers/clientes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Conexión a BD
pool.getConnection()
  .then(() => console.log('✅ Conectado a MySQL'))
  .catch(err => console.error('❌ Error de conexión a MySQL:', err));

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/metodos', metodosRouter);
app.use('/api/clientes', clientesRouter);

// Manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
