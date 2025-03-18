import { Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/authMiddleware';

const productosRouter = require('express').Router();

// Interface para TypeScript
interface ProductoBody {
  nombre: string;
  descripcion?: string;
  categorias: number[];
  proveedor_id: number;
  variantes: Array<{
    codigo_barras: string;
    atributos: Record<string, any>;
    precio: number;
  }>;
}

// Interface para Ajuste de Precios
interface AjustePrecios {
  tipo: 'costo' | 'venta1' | 'venta2' | 'venta3';
  porcentaje: number;
  categoria_id?: number;
  proveedor_id?: number;
  productos?: number[];
}

// Obtener todos los productos con sus relaciones
productosRouter.get('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.proveedor_id,
        pr.nombre AS proveedor,
        JSON_ARRAYAGG(DISTINCT c.nombre) AS categorias,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', v.id,
            'codigo_barras', v.codigo_barras,
            'atributos', v.atributos,
            'precio', v.precio,
            'imagen_url', v.imagen_url
          )
        ) AS variantes,
        i.cantidad AS stock,
        i.minimo AS stock_minimo
      FROM productos p
      INNER JOIN proveedores pr ON p.proveedor_id = pr.id
      LEFT JOIN producto_categorias pc ON p.id = pc.producto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      LEFT JOIN variantes v ON p.id = v.producto_id
      LEFT JOIN inventario i ON p.id = i.producto_id
      GROUP BY p.id
    `;

    const [productos] = await pool.query(query);
    res.json({ success: true, data: productos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// Crear producto con variantes y categorías
productosRouter.post('/', authenticate(['maestro']), async (req: Request, res: Response) => {
  const body: ProductoBody = req.body;
  
  // Validación
  if (!body.nombre || !body.proveedor_id || !body.categorias?.length || !body.variantes?.length) {
    return res.status(400).json({ 
      success: false,
      message: 'Faltan campos requeridos: nombre, proveedor_id, categorias, variantes' 
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insertar producto principal
    const [productResult] = await conn.query(
      `INSERT INTO productos (nombre, descripcion, proveedor_id)
      VALUES (?, ?, ?)`,
      [body.nombre, body.descripcion, body.proveedor_id]
    );
    const productId = (productResult as any).insertId;

    // 2. Insertar categorías
    const categoryPromises = body.categorias.map(categoriaId => 
      conn.query(
        `INSERT INTO producto_categorias (producto_id, categoria_id)
        VALUES (?, ?)`,
        [productId, categoriaId]
      )
    );
    await Promise.all(categoryPromises);

    // 3. Insertar variantes
    const variantPromises = body.variantes.map(variante => {
      return conn.query(
        `INSERT INTO variantes 
        (producto_id, codigo_barras, atributos, precio)
        VALUES (?, ?, ?, ?)`,
        [productId, variante.codigo_barras, JSON.stringify(variante.atributos), variante.precio]
      );
    });
    await Promise.all(variantPromises);

    // 4. Crear registro de inventario
    await conn.query(
      `INSERT INTO inventario (producto_id, cantidad, minimo)
      VALUES (?, 0, 10)`,
      [productId]
    );

    await conn.commit();
    
    res.status(201).json({ 
      success: true,
      id: productId,
      message: 'Producto creado con éxito'
    });

  } catch (error: any) {
    await conn.rollback();
    
    // Manejar errores únicos de código de barras
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('codigo_barras')) {
      return res.status(400).json({
        success: false,
        message: 'El código de barras ya existe en el sistema'
      });
    }

    console.error('Error en transacción:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear producto'
    });
  } finally {
    conn.release();
  }
});

// Ajustes masivos de precios
productosRouter.post('/ajustes-precios', authenticate(['maestro']), async (req: Request, res: Response) => {
  const ajuste: AjustePrecios = req.body;

  // Validación de entrada
  if (!ajuste.tipo || !ajuste.porcentaje || (!ajuste.categoria_id && !ajuste.proveedor_id && !ajuste.productos)) {
    return res.status(400).json({ success: false, message: 'Datos de entrada inválidos' });
  }
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let whereClause = '';
    const params: any[] = [ajuste.porcentaje / 100, ajuste.tipo];
    
    if (ajuste.categoria_id) {
      whereClause = 'WHERE p.categoria_id = ?';
      params.push(ajuste.categoria_id);
    } else if (ajuste.proveedor_id) {
      whereClause = 'WHERE p.proveedor_id = ?';
      params.push(ajuste.proveedor_id);
    } else if (ajuste.productos) {
      whereClause = 'WHERE p.id IN (?)';
      params.push(ajuste.productos);
    }

    const query = `
      UPDATE precios pr
      JOIN productos p ON pr.producto_id = p.id
      SET pr.precio = pr.precio * (1 + ?)
      ${whereClause}
      AND pr.tipo = ?
    `;

    await conn.query(query, params);

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    console.error('Error en ajuste:', error);
    res.status(500).json({ success: false, message: 'Error en ajuste' });
  } finally {
    conn.release();
  }
});

export default productosRouter;