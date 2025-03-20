import { Request, Response } from 'express';
import pool from '../../../infrastructure/database/db';

const ventasPagosRouter = require('express').Router();

// Obtener detalle completo de pagos por venta
ventasPagosRouter.get('/:id/pagos', async (req: Request, res: Response) => {
  try {
    const [result]: any[] = await pool.query(
      `SELECT 
        p.fecha,
        mp.nombre AS metodo,
        dmp.moneda,
        dmp.monto,
        dmp.tasa_cambio,
        ROUND(dmp.monto / dmp.tasa_cambio, 2) AS monto_usd
      FROM pagos p
      JOIN detalle_metodos_pago dmp ON p.id = dmp.pago_id
      JOIN metodos_pago mp ON dmp.metodo_pago_id = mp.id
      WHERE p.venta_id = ?`,
      [req.params.id]
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error en reporte' });
  }
});

export default ventasPagosRouter;