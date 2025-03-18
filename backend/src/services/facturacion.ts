import { format } from 'date-fns';
import pdfkit from 'pdfkit';
import pool from '../db';

export const generarFacturaPDF = async (ventaId: number): Promise<Buffer> => {
  try {
    const [venta]: any[] = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.documento AS cliente_doc 
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = ?`,
      [ventaId]
    );

    if (!venta.length) {
      throw new Error(`Venta con ID ${ventaId} no encontrada`);
    }

    const [detalles]: any[] = await pool.query(
      `SELECT dv.*, v.atributos 
       FROM detalles_venta dv
       JOIN variantes v ON dv.variante_id = v.id
       WHERE dv.venta_id = ?`,
      [ventaId]
    );

    const doc = new pdfkit();
    let buffers: any = [];
    
    // Cabecera
    doc.fontSize(18).text('Factura Legal', { align: 'center' });
    doc.fontSize(12).text(`Número: ${venta[0].codigo_venta}`, { align: 'center' });
    doc.text(`Fecha: ${format(new Date(venta[0].creado_en), 'dd/MM/yyyy HH:mm')}`);
    doc.moveDown();

    // Datos Cliente
    doc.text(`Cliente: ${venta[0].cliente_nombre || 'Consumidor Final'}`);
    doc.text(`Documento: ${venta[0].cliente_doc || 'No especificado'}`);
    doc.moveDown();

    // Items
    doc.font('Helvetica-Bold').text('Detalle de la Venta:', { underline: true });
    detalles.forEach((detalle: any) => {
      doc.font('Helvetica').text(
        `${JSON.parse(detalle.atributos).presentacion || 'Producto'} - ` +
        `${detalle.cantidad} x $${detalle.precio_unitario.toFixed(2)} = $${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}`
      );
    });

    doc.moveDown().text(`Total: $${venta[0].total.toFixed(2)} ${venta[0].moneda}`);
    
    // Generar PDF
    doc.end();
    doc.on('data', buffers.push.bind(buffers));
    
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  } catch (error) {
    console.error('Error al generar factura PDF:', error);
    throw new Error('No se pudo generar la factura en PDF');
  }
};

// Ejemplo de XML básico para Venezuela
export const generarFacturaXML = async (ventaId: number): Promise<string> => {
  try {
    const [venta]: any[] = await pool.query('SELECT * FROM ventas WHERE id = ?', [ventaId]);

    if (!venta.length) {
      throw new Error(`Venta con ID ${ventaId} no encontrada`);
    }

    return `
      <Factura xmlns="http://www.seniat.gob.ve/impuesto/soap">
        <Encabezado>
          <Numero>${venta[0].codigo_venta}</Numero>
          <Fecha>${new Date(venta[0].creado_en).toISOString()}</Fecha>
        </Encabezado>
        <Total>${venta[0].total.toFixed(2)}</Total>
      </Factura>
    `;
  } catch (error) {
    console.error('Error al generar factura XML:', error);
    throw new Error('No se pudo generar la factura en XML');
  }
};