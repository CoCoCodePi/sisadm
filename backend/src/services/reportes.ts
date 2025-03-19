import pdfkit from 'pdfkit';
import pool from '../db';
import { format } from 'date-fns';

// Generar reporte de cierre de caja
export const generarReporteCierreCaja = async (fecha: string): Promise<Buffer> => {
  const conn = await pool.getConnection();
  try {
    // Obtener datos de la caja diaria para la fecha dada
    const [caja]: any[] = await conn.query(
      `SELECT * FROM caja_diaria WHERE fecha = ?`,
      [fecha]
    );

    if (caja.length === 0) {
      throw new Error('No hay caja abierta para la fecha proporcionada');
    }

    const cajaData = caja[0];

    // Obtener movimientos de caja para la fecha dada
    const [movimientos]: any[] = await conn.query(
      `SELECT * FROM movimientos_caja WHERE caja_diaria_id = ?`,
      [cajaData.id]
    );

    // Crear documento PDF
    const doc = new pdfkit();
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Añadir contenido al PDF
    doc.text(`Reporte de Cierre de Caja - ${fecha}`, { align: 'center' });
    doc.text(`Hora de Apertura: ${format(new Date(cajaData.hora_apertura), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'left' });
    doc.text(`Hora de Cierre: ${format(new Date(cajaData.hora_cierre), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'left' });
    doc.text(`Monto Inicial: ${cajaData.monto_inicial}`, { align: 'left' });
    doc.text(`Monto Final: ${cajaData.monto_final}`, { align: 'left' });

    doc.text('Movimientos del Día:', { align: 'left' });
    movimientos.forEach((movimiento: any) => {
      doc.text(`${movimiento.concepto} - ${movimiento.tipo} - ${movimiento.monto} - ${movimiento.metodo_pago}`, { align: 'left' });
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return pdfBuffer;
  } finally {
    conn.release();
  }
};