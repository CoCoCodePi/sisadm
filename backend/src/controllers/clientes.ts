import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const clientesRouter = require('express').Router();

// GET / - Obtener todos los clientes
clientesRouter.get('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
    try {
        const [clientes] = await pool.query('SELECT c.id, c.nombre, c.email, c.telefono, c.direccion, c.documento, td.codigo as tipo_documento, c.permite_credito, c.limite_credito FROM clientes c JOIN tipo_documentos td ON c.tipo_documento_id = td.id ORDER BY c.nombre ASC');
        res.json({ success: true, data: clientes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener clientes' });
    }
});

// GET /lookup/:documento - Buscar un cliente por su documento
clientesRouter.get('/lookup/:documento', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
    const { documento } = req.params;
    try {
        // La base de datos guarda el documento sin prefijo, así que buscamos el número limpio.
        const documentoLimpio = documento.replace(/^[VvJjEeGg]-?/i, '').trim();
        const query = `
            SELECT c.id, c.nombre, c.email, c.telefono, c.direccion, c.documento, td.codigo as tipo_documento, c.permite_credito, c.limite_credito
            FROM clientes c
            JOIN tipo_documentos td ON c.tipo_documento_id = td.id
            WHERE c.documento = ?
        `;
        const [clientes] = await pool.query<RowDataPacket[]>(query, [documentoLimpio]);
        if (clientes.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.json({ success: true, data: clientes[0] });
    } catch (error) {
        console.error("--- ERROR EN GET /api/clientes/lookup ---", error);
        res.status(500).json({ success: false, message: 'Error al buscar cliente.' });
    }
});

// GET /:id - Obtener un cliente por ID (para editar o ver detalle)
clientesRouter.get('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT c.id, c.nombre, c.email, c.telefono, c.direccion, c.tipo_documento_id, td.codigo as tipo_documento, c.documento, c.permite_credito, c.limite_credito FROM clientes c JOIN tipo_documentos td ON c.tipo_documento_id = td.id WHERE c.id = ?",
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error al obtener cliente por ID:", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener el cliente.' });
    }
});


// POST / - Crear un nuevo cliente
clientesRouter.post('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
    const { nombre, tipo_documento, documento, email, telefono, direccion, permite_credito, limite_credito } = req.body;
    if (!nombre || !tipo_documento || !documento) {
        return res.status(400).json({ success: false, message: 'Nombre, tipo y número de documento son requeridos.' });
    }
    const documentoLimpio = documento.replace(/^[VvJjEeGg]-?/i, '').trim();
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [tiposDoc] = await conn.query<RowDataPacket[]>("SELECT id FROM tipo_documentos WHERE codigo = ?", [tipo_documento]);
        if (tiposDoc.length === 0) throw new Error("Tipo de documento inválido.");
        const tipoDocumentoId = tiposDoc[0].id;

        const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM clientes WHERE tipo_documento_id = ? AND documento = ?", [tipoDocumentoId, documentoLimpio]);
        if (existing.length > 0) throw new Error("Un cliente con este documento ya existe.");

        // Incluir permite_credito y limite_credito en la inserción
        const [result] = await conn.query<ResultSetHeader>(`
            INSERT INTO clientes (nombre, tipo_documento_id, documento, email, telefono, direccion, permite_credito, limite_credito)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [nombre, tipoDocumentoId, documentoLimpio, email, telefono, direccion, permite_credito || false, limite_credito || 0]);
        const newClientId = result.insertId;
        const [newClient] = await conn.query<RowDataPacket[]>("SELECT c.id, c.nombre, c.email, c.telefono, c.direccion, c.documento, td.codigo as tipo_documento, c.permite_credito, c.limite_credito FROM clientes c JOIN tipo_documentos td ON c.tipo_documento_id = td.id WHERE c.id = ?", [newClientId]);

        await conn.commit();
        res.status(201).json({ success: true, data: newClient[0] });
    } catch(error) {
        await conn.rollback();
        const err = error as Error;
        console.error("--- ERROR EN POST /api/clientes ---", error);
        res.status(500).json({ success: false, message: err.message || 'Error del servidor al crear cliente.' });
    } finally {
        conn.release();
    }
});

// PUT /:id - Actualizar un cliente existente
clientesRouter.put('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, tipo_documento, documento, email, telefono, direccion, permite_credito, limite_credito } = req.body;

    if (!nombre || !tipo_documento || !documento) {
        return res.status(400).json({ success: false, message: 'Nombre, tipo y número de documento son requeridos.' });
    }
    const documentoLimpio = documento.replace(/^[VvJjEeGg]-?/i, '').trim();

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [tiposDoc] = await conn.query<RowDataPacket[]>("SELECT id FROM tipo_documentos WHERE codigo = ?", [tipo_documento]);
        if (tiposDoc.length === 0) throw new Error("Tipo de documento inválido.");
        const tipoDocumentoId = tiposDoc[0].id;

        // Verificar si el documento ya existe para otro cliente (excluyendo el actual)
        const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM clientes WHERE tipo_documento_id = ? AND documento = ? AND id != ?", [tipoDocumentoId, documentoLimpio, id]);
        if (existing.length > 0) throw new Error("Un cliente con este documento ya existe.");

        // Incluir permite_credito y limite_credito en la actualización
        const [result] = await conn.query<ResultSetHeader>(
            `UPDATE clientes SET nombre = ?, tipo_documento_id = ?, documento = ?, email = ?, telefono = ?, direccion = ?, permite_credito = ?, limite_credito = ? WHERE id = ?`,
            [nombre, tipoDocumentoId, documentoLimpio, email, telefono, direccion, permite_credito, limite_credito, id]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }

        const [updatedClient] = await conn.query<RowDataPacket[]>(
            "SELECT c.id, c.nombre, c.email, c.telefono, c.direccion, c.documento, td.codigo as tipo_documento, c.permite_credito, c.limite_credito FROM clientes c JOIN tipo_documentos td ON c.tipo_documento_id = td.id WHERE c.id = ?",
            [id]
        );

        await conn.commit();
        res.json({ success: true, message: 'Cliente actualizado exitosamente.', data: updatedClient[0] });

    } catch (error) {
        await conn.rollback();
        const err = error as Error;
        console.error("--- ERROR EN PUT /api/clientes/:id ---", error);
        res.status(500).json({ success: false, message: err.message || 'Error del servidor al actualizar cliente.' });
    } finally {
        conn.release();
    }
});


// DELETE /api/clientes/:id - Eliminar un cliente
clientesRouter.delete('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query<ResultSetHeader>('DELETE FROM clientes WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.json({ success: true, message: 'Cliente eliminado exitosamente.' });
    } catch (error) {
        console.error("--- ERROR EN DELETE /api/clientes/:id ---", error);
        res.status(500).json({ success: false, message: 'Error del servidor al eliminar cliente.' });
    }
});

// GET /api/clientes/:id/cuentas-por-cobrar - Obtener cuentas por cobrar de un cliente
clientesRouter.get('/:id/cuentas-por-cobrar', authenticate(['admin', 'maestro', 'vendedor']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [cuentas] = await pool.query<RowDataPacket[]>(
            `SELECT cxc.*, v.codigo_venta, v.total_venta as venta_total, v.moneda as venta_moneda
             FROM cuentas_por_cobrar cxc
             JOIN ventas v ON cxc.venta_id = v.id
             WHERE cxc.cliente_id = ?`,
            [id]
        );
        res.json({ success: true, data: cuentas });
    } catch (error) {
        console.error("Error al obtener cuentas por cobrar del cliente:", error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener cuentas por cobrar.' });
    }
});


export default clientesRouter;