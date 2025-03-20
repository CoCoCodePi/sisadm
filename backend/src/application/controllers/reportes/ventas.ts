import { Request, Response } from 'express';
import { generarReporteVentas } from '../../../application/services/reportes';
import { authenticate } from '../../../infrastructure/middlewares/authMiddleware';

const ventasReportesRouter = require('express').Router();

// Generar reporte de ventas
ventasReportesRouter.get('/reporte', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    const pdfBuffer = await generarReporteVentas(fechaInicio as string, fechaFin as string);

    res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${fechaInicio}_a_${fechaFin}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar el reporte de ventas' });
  }
});

export default ventasReportesRouter;