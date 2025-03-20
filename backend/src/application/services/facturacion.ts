import pdfkit from 'pdfkit';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';
import pool from '../../infrastructure/database/db';

// Generar PDF de la factura
export const generarFacturaPDF = async (facturaBody: any): Promise<Buffer> => {
  const conn = await pool.getConnection();
  try {
    // Crear documento PDF
    const doc = new pdfkit();
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Añadir contenido al PDF
    doc.text(`Factura: ${facturaBody.codigo_factura}`, { align: 'center' });
    doc.text(`Fecha de Emisión: ${format(new Date(), 'yyyy-MM-dd')}`, { align: 'center' });

    // Más contenido PDF basado en los datos de la factura
    // ...

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return pdfBuffer; // Asegurarse de que se devuelve un Buffer
  } finally {
    conn.release();
  }
};

// Enviar factura por correo electrónico
export const enviarFacturaPorCorreo = async (clienteId: number, codigoFactura: string, pdfBuffer: Buffer): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    // Obtener datos del cliente
    const [cliente]: any[] = await conn.query(
      `SELECT email FROM clientes WHERE id = ?`,
      [clienteId]
    );

    if (cliente.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    const clienteEmail = cliente[0].email;

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
      }
    });

    // Enviar correo con la factura adjunta
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: clienteEmail,
      subject: `Factura ${codigoFactura}`,
      text: 'Adjunto encontrará su factura.',
      attachments: [
        {
          filename: `Factura_${codigoFactura}.pdf`,
          content: pdfBuffer // Asegurarse de que se envía como Buffer
        }
      ]
    });
  } finally {
    conn.release();
  }
};