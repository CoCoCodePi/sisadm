import { Request, Response } from 'express';
import { generarReporteInventario } from '../../services/reportes';
import { authenticate } from '../../middleware/authMiddleware';

const inventarioReportesRouter = require('express').Router();

// Generar reporte de inventario
inventarioReportesRouter.get('/reporte', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await generarReporteInventario();

    res.setHeader('Content-Disposition', 'attachment; filename="reporte_inventario.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar el reporte de inventario' });
  }
});

export default inventarioReportesRouter;