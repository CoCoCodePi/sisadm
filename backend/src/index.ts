import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import pool from './db';
import authRouter from './controllers/authController';
import productosRouter from './controllers/productos';
import ventasRouter from './controllers/ventas';
import metodosPagoRouter from './controllers/metodosPago';
import clientesRouter from './controllers/clientes';
import inventarioRouter from './controllers/inventario';
import cuentasPorPagarRouter from './controllers/cuentasPorPagar';
import cuentasPorCobrarRouter from './controllers/cuentasPorCobrar';
import dashboardRouter from './controllers/dashboard';
import reportesRouter from './controllers/reportes'; // <-- IMPORTACIÓN AÑADIDA
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import proveedoresRouter from './controllers/proveedores';
import categoriasRouter from './controllers/categorias';
import unidadesMedidaRouter from './controllers/unidadesMedida';
import marcasRouter from './controllers/marcas';
import comprasRouter from './controllers/compras';
import tasasRouter from './controllers/tasas';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiLimiter);

pool.getConnection()
  .then(() => console.log('✅ Conectado a MySQL'))
  .catch(err => console.error('❌ Error de conexión a MySQL:', err));

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/metodos-pago', metodosPagoRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/cuentas-por-pagar', cuentasPorPagarRouter);
app.use('/api/cuentas-por-cobrar', cuentasPorCobrarRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reportes', reportesRouter); // <-- RUTA REGISTRADA
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/marcas', marcasRouter);
app.use('/api/unidades-medida', unidadesMedidaRouter);
app.use('/api/compras', comprasRouter);
app.use('/api/tasas', tasasRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});