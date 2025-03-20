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

// Generar reporte de inventario
export const generarReporteInventario = async (): Promise<Buffer> => {
  const conn = await pool.getConnection();
  try {
    // Obtener datos de productos y variantes
    const [productos]: any[] = await conn.query(`SELECT * FROM productos`);
    const [variantes]: any[] = await conn.query(`SELECT * FROM variantes`);
    const [movimientos]: any[] = await conn.query(`SELECT * FROM movimientos_inventario`);

    // Crear documento PDF
    const doc = new pdfkit();
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Añadir contenido al PDF
    doc.text('Reporte de Inventario', { align: 'center' });
    doc.text(`Fecha: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'left' });

    doc.text('Productos:', { align: 'left' });
    productos.forEach((producto: any) => {
      doc.text(`- ${producto.nombre}: ${producto.descripcion}`, { align: 'left' });
    });

    doc.text('Variantes:', { align: 'left' });
    variantes.forEach((variante: any) => {
      doc.text(`- ${variante.nombre}: Precio: ${variante.precio}, Stock: ${variante.stock}`, { align: 'left' });
    });

    doc.text('Movimientos de Inventario:', { align: 'left' });
    movimientos.forEach((movimiento: any) => {
      doc.text(`- ${movimiento.tipo}: ${movimiento.cantidad} unidades - Motivo: ${movimiento.motivo}`, { align: 'left' });
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return pdfBuffer;
  } finally {
    conn.release();
  }
};

// Generar reporte de cliente
export const generarReporteCliente = async (clienteId: number): Promise<Buffer> => {
  const conn = await pool.getConnection();
  try {
    // Obtener datos del cliente
    const [cliente]: any[] = await conn.query(`SELECT * FROM clientes WHERE id = ?`, [clienteId]);
    if (cliente.length === 0) {
      throw new Error('Cliente no encontrado');
    }
    const clienteData = cliente[0];

    // Obtener historial de compras del cliente
    const [historial]: any[] = await conn.query(
      `SELECT v.id, v.fecha, v.total, v.moneda FROM ventas v WHERE v.cliente_id = ?`,
      [clienteId]
    );

    // Crear documento PDF
    const doc = new pdfkit();
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Añadir contenido al PDF
    doc.text(`Reporte de Cliente - ${clienteData.nombre}`, { align: 'center' });
    doc.text(`Correo: ${clienteData.correo}`, { align: 'left' });
    doc.text(`Teléfono: ${clienteData.telefono}`, { align: 'left' });
    doc.text(`Dirección: ${clienteData.direccion}`, { align: 'left' });

    doc.text('Historial de Compras:', { align: 'left' });
    historial.forEach((compra: any) => {
      doc.text(`- Venta ID: ${compra.id} - Fecha: ${format(new Date(compra.fecha), 'yyyy-MM-dd')} - Total: ${compra.total} ${compra.moneda}`, { align: 'left' });
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return pdfBuffer;
  } finally {
    conn.release();
  }
};

// Generar reporte de ventas
export const generarReporteVentas = async (fechaInicio: string, fechaFin: string): Promise<Buffer> => {
  const conn = await pool.getConnection();
  try {
    // Obtener datos de ventas y detalles de ventas para el rango de fechas dado
    const [ventas]: any[] = await conn.query(
      `SELECT v.id, v.fecha, v.total, v.moneda, c.nombre AS cliente
       FROM ventas v
       JOIN clientes c ON v.cliente_id = c.id
       WHERE v.fecha BETWEEN ? AND ?`,
      [fechaInicio, fechaFin]
    );

    const [detalles]: any[] = await conn.query(
      `SELECT dv.venta_id, dv.variante_id, dv.cantidad, dv.precio_unitario, p.nombre AS producto
       FROM detalles_venta dv
       JOIN variantes v ON dv.variante_id = v.id
       JOIN productos p ON v.producto_id = p.id
       WHERE dv.venta_id IN (?)`,
      [ventas.map((v: { id: number }) => v.id)] // Agrega tipo al parámetro v
    );

    // Crear documento PDF
    const doc = new pdfkit();
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Añadir contenido al PDF
    doc.text(`Reporte de Ventas - Desde ${fechaInicio} Hasta ${fechaFin}`, { align: 'center' });

    ventas.forEach((venta: any) => {
      doc.text(`Venta ID: ${venta.id} - Fecha: ${format(new Date(venta.fecha), 'yyyy-MM-dd')} - Cliente: ${venta.cliente} - Total: ${venta.total} ${venta.moneda}`, { align: 'left' });
      doc.text('Detalles de Venta:', { align: 'left' });

      detalles.filter((detalle: any) => detalle.venta_id === venta.id).forEach((detalle: any) => {
        doc.text(`- Producto: ${detalle.producto} - Cantidad: ${detalle.cantidad} - Precio Unitario: ${detalle.precio_unitario}`, { align: 'left' });
      });
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return pdfBuffer;
  } finally {
    conn.release();
  }
};

// Generar reporte de cuentas por pagar
export const generarReporteCuentasPorPagar = async (): Promise<Buffer> => {
  const conn = await pool.getConnection();
  try {
    // Obtener datos de proveedores, compras y pagos
    const [proveedores]: any[] = await conn.query(`SELECT * FROM proveedores`);
    const [compras]: any[] = await conn.query(`SELECT * FROM compras`);
    const [pagos]: any[] = await conn.query(`SELECT * FROM pagos`);

    // Crear documento PDF
    const doc = new pdfkit();
    const buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Añadir contenido al PDF
    doc.text('Reporte de Cuentas por Pagar', { align: 'center' });
    doc.text(`Fecha: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'left' });

    doc.text('Proveedores:', { align: 'left' });
    proveedores.forEach((proveedor: any) => {
      doc.text(`- ${proveedor.nombre}: ${proveedor.contacto}, Tel: ${proveedor.telefono}, Dirección: ${proveedor.direccion}, Término de Pago: ${proveedor.termino_pago}`, { align: 'left' });
    });

    doc.text('Compras:', { align: 'left' });
    compras.forEach((compra: any) => {
      doc.text(`- Compra ID: ${compra.id}, Proveedor: ${compra.proveedor_id}, Fecha: ${format(new Date(compra.fecha), 'yyyy-MM-dd')}, Monto: ${compra.monto}, Productos: ${compra.productos}, Condiciones de Pago: ${compra.condiciones_pago}`, { align: 'left' });
    });

    doc.text('Pagos:', { align: 'left' });
    pagos.forEach((pago: any) => {
      doc.text(`- Pago ID: ${pago.id}, Compra ID: ${pago.compra_id}, Fecha de Pago: ${format(new Date(pago.fecha_pago), 'yyyy-MM-dd')}, Monto: ${pago.monto}, Método de Pago: ${pago.metodo_pago}`, { align: 'left' });
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return pdfBuffer;
  } finally {
    conn.release();
  }
};