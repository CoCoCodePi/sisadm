import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './db';
import authRouter from './controllers/authController';
import productosRouter from './controllers/productos';
import ventasRouter from './controllers/ventas';
import pagosRouter from './controllers/pagos';
import metodosRouter from './controllers/metodosPago';
import clientesRouter from './controllers/clientes';
import notasRouter from './controllers/notasCredito';
import inventarioRouter from './controllers/inventario';
import cuadreCajaRouter from './controllers/cuadreCaja';
import ventasPagosRouter from './controllers/reportes/ventasPagos';
import cierreCajaRouter from './controllers/reportes/cierreCaja';
import inventarioReportesRouter from './controllers/reportes/inventario';
import ventasReportesRouter from './controllers/reportes/ventas';
import cuentasPorPagarRouter from './controllers/cuentasPorPagar';
import dashboardRouter from './controllers/dashboard';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

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
app.use('/api/reportes/ventas', ventasPagosRouter);
app.use('/api/reportes/cierre-caja', cierreCajaRouter);
app.use('/api/reportes/inventario', inventarioReportesRouter);
app.use('/api/reportes/ventas', ventasReportesRouter);
app.use('/api/cuentas-por-pagar', cuentasPorPagarRouter);
app.use('/api/dashboard', dashboardRouter); // Añadir rutas del dashboard

// Manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});