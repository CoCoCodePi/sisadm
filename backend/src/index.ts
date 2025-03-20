import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './infrastructure/database/db';
import authRouter from './application/controllers/authController';
import productosRouter from './application/controllers/productos';
import { errorHandler } from './infrastructure/middlewares/errorHandler';
import { apiLimiter } from './infrastructure/middlewares/rateLimiter';
import ventasRouter from './application/controllers/ventas';
import pagosRouter from './application/controllers/pagos';
import metodosRouter from './application/controllers/metodosPago';
import clientesRouter from './application/controllers/clientes';
import notasRouter from './application/controllers/notasCredito';
import inventarioRouter from './application/controllers/inventario';
import cuadreCajaRouter from './application/controllers/cuadreCaja';
import ventasPagosRouter from './application/controllers/reportes/ventasPagos';
import cierreCajaRouter from './application/controllers/reportes/cierreCaja';
import inventarioReportesRouter from './application/controllers/reportes/inventario';
import ventasReportesRouter from './application/controllers/reportes/ventas';
import cuentasPorPagarRouter from './application/controllers/cuentasPorPagar';

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
app.use('/api/', apiLimiter); // Aplicar rate limiting

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
app.use('/api/notas', notasRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/cuadre-caja', cuadreCajaRouter);
app.use('/api/reportes/ventas-pagos', ventasPagosRouter);
app.use('/api/reportes/cierre-caja', cierreCajaRouter);
app.use('/api/reportes/inventario', inventarioReportesRouter);
app.use('/api/reportes/ventas', ventasReportesRouter);
app.use('/api/cuentas-por-pagar', cuentasPorPagarRouter);

// Manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});