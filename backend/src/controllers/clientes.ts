import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const clientesRouter = require('express').Router();

// Tipos TypeScript
interface ClienteBody {
  tipo_documento_id: number;
  documento: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  vendedor_id?: number;
}

// Validar formato de documentos
const validarDocumento = async (tipoDocId: number, documento: string): Promise<boolean> => {
  const [tipoDoc]: any[] = await pool.query(
    'SELECT codigo FROM tipo_documentos WHERE id = ?',
    [tipoDocId]
  );
  
  if (!tipoDoc.length) return false;

  const regexMap: { [key: string]: RegExp } = {
    'J': /^[Jj][-]?\d{8}[-]?\d$/,
    'V': /^[VvEe]?[-]?\d{7,8}$/,
    'E': /^[Ee][-]?\d{8}$/,
    'P': /^[A-Za-z]{2}\d{6}$/
  };

  const codigo = tipoDoc[0].codigo.toUpperCase();
  return regexMap[codigo].test(documento);
};

// Crear cliente
clientesRouter.post('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
  const body: ClienteBody = req.body;
  
  try {
    // Validar existencia del tipo de documento
    const [tipoDoc]: any[] = await pool.query(
      'SELECT id FROM tipo_documentos WHERE id = ?',
      [body.tipo_documento_id]
    );
    
    if (!tipoDoc.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Tipo de documento inválido' 
      });
    }

    // Validar formato del documento
    if (!(await validarDocumento(body.tipo_documento_id, body.documento))) {
      return res.status(400).json({
        success: false,
        message: 'Formato de documento incorrecto'
      });
    }

    // Insertar cliente
    const [result]: any[] = await pool.query(
      `INSERT INTO clientes 
      (tipo_documento_id, documento, nombre, email, telefono, direccion, vendedor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.tipo_documento_id,
        body.documento.replace(/-/g, '').toUpperCase(),
        body.nombre,
        body.email,
        body.telefono,
        body.direccion,
        body.vendedor_id || req.user?.id
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId
    });

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El documento ya está registrado'
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente'
    });
  }
});

// Obtener clientes con filtros
clientesRouter.get('/', authenticate(['vendedor', 'admin', 'maestro']), async (req: Request, res: Response) => {
  const { tipo_documento, documento, vendedor_id } = req.query;

  try {
    let query = `
      SELECT c.*, td.codigo AS tipo_documento, td.nombre AS nombre_documento 
      FROM clientes c
      INNER JOIN tipo_documentos td ON c.tipo_documento_id = td.id
      WHERE 1=1
    `;
    const params = [];

    if (tipo_documento) {
      query += ' AND td.codigo = ?';
      params.push(tipo_documento);
    }
    
    if (documento) {
      query += ' AND c.documento LIKE ?';
      params.push(`%${documento}%`);
    }
    
    if (vendedor_id) {
      query += ' AND c.vendedor_id = ?';
      params.push(vendedor_id);
    }

    const [clientes] = await pool.query(query, params);
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener clientes' });
  }
});

export default clientesRouter;