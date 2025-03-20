import { Request, Response } from 'express';
import { generarReporteCierreCaja } from '../../../application/services/reportes';
import { authenticate } from '../../../infrastructure/middlewares/authMiddleware';

const cierreCajaRouter = require('express').Router();

// Obtener reporte de cierre de caja
cierreCajaRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { fecha } = req.query;

  try {
    const pdfBuffer = await generarReporteCierreCaja(fecha as string);

    res.setHeader('Content-Disposition', `attachment; filename="reporte_cierre_caja_${fecha}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar reporte de cierre de caja:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar el reporte de cierre de caja' });
  }
});

export default cierreCajaRouter;