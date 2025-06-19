import { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/authMiddleware";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

// Interfaces
interface VarianteBody { 
  id?: number | string;
  nombre: string;
  cantidad: number;
  precio_1: number;
  precio_2: number;
  precio_3: number;
  precio_4: number;
  costo_base_venta?: number;
  codigos_barras: string[];
  atributos: Record<string, any>;
  imagenes: string[];
}
interface ProductoBody { 
  nombre: string; 
  descripcion?: string; 
  marca: { id?: number; nombre: string; } | null; 
  linea: { id?: number; nombre: string; } | null; 
  categoria_principal: { id: number | 0; nombre: string; } | null;
  unidad_medida_base: string; 
  categorias_secundarias: { id: number | 0; nombre: string; }[];
  proveedores: { id: number; es_principal: boolean; }[];
  variantes: VarianteBody[];
  imagenes: string[];
}

const productosRouter = require("express").Router();

const PRODUCTOS_QUERY = `
SELECT 
  p.id, p.nombre, p.descripcion, p.unidad_medida_base, p.estado, p.fecha_creacion,
  m.id as marca_id, m.nombre as marca_nombre,
  lp.id as linea_id, lp.nombre as linea_nombre,
  cp.id as categoria_principal_id, cp.nombre as categoria_principal,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('url', pi.url, 'es_principal', pi.es_principal)) FROM producto_imagenes pi WHERE pi.producto_id = p.id) as imagenes,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'id', v.id, 'nombre', v.nombre, 'cantidad', v.cantidad, 
      'atributos', v.atributos, 'costo_promedio', v.costo_promedio, 'costo_base_venta', v.costo_base_venta,
      'precio_1', v.precio_1, 'precio_2', v.precio_2, 'precio_3', v.precio_3, 'precio_4', v.precio_4,
      'codigos_barras', (SELECT JSON_ARRAYAGG(vc.codigo_barras) FROM variante_codigos_barras vc WHERE vc.variante_id = v.id),
      'imagenes', (SELECT JSON_ARRAYAGG(JSON_OBJECT('url', vi.url, 'es_principal', vi.es_principal)) FROM variante_imagenes vi WHERE vi.variante_id = v.id)
    )) 
    FROM variantes v WHERE v.producto_id = p.id
  ) as variantes,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', pp.proveedor_id, 'nombre', pr.nombre, 'es_principal', pp.es_principal)) FROM producto_proveedores pp JOIN proveedores pr ON pp.proveedor_id = pr.id WHERE pp.producto_id = p.id) as proveedores,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', pc.categoria_id, 'nombre', c.nombre)) FROM producto_categorias pc JOIN categorias c ON pc.categoria_id = c.id WHERE pc.producto_id = p.id) as categorias_secundarias
FROM productos p
LEFT JOIN marcas m ON p.marca_id = m.id
LEFT JOIN lineas_producto lp ON p.linea_id = lp.id
LEFT JOIN categorias cp ON p.categoria_principal_id = cp.id
`;

// --- AÑADIDO: Función de validación del backend ---
const validarProducto = (body: ProductoBody): string[] => {
    const errors: string[] = [];
    if (!body.nombre?.trim()) errors.push("El nombre del producto es requerido.");
    if (!body.marca?.nombre?.trim()) errors.push("La marca es requerida.");
    if (!body.linea?.nombre?.trim()) errors.push("La línea es requerida.");
    if (!body.unidad_medida_base?.trim()) errors.push("La unidad de medida base es requerida.");
    if (!body.variantes || body.variantes.length === 0) {
        errors.push("Debe existir al menos una variante.");
    } else {
        body.variantes.forEach((v, index) => {
            if (!v.nombre?.trim()) errors.push(`La variante #${index + 1} debe tener un nombre.`);
            if (!v.cantidad || v.cantidad <= 0) errors.push(`La variante '${v.nombre}' debe tener una cantidad/contenido mayor a 0.`);
            if (!v.precio_1 || v.precio_1 <= 0) errors.push(`La variante '${v.nombre}' debe tener un precio de venta mayor a 0.`);
            if (!v.codigos_barras || v.codigos_barras.length === 0) errors.push(`La variante '${v.nombre}' debe tener al menos un código de barras.`);
        });
    }
    if (body.proveedores?.filter(p => p.es_principal).length > 1) {
        errors.push("Solo puede haber un proveedor principal.");
    }
    return errors;
};


async function updateRelations(conn: PoolConnection, productId: number, body: ProductoBody) {
  // ... (Esta función no cambia)
  const { proveedores, imagenes, variantes, categorias_secundarias } = body;
  const resolvedCategoryIds = [];
  if (categorias_secundarias && categorias_secundarias.length > 0) {
    for (const cat of categorias_secundarias) {
      if (cat.id > 0) { resolvedCategoryIds.push(cat.id); } 
      else if (cat.nombre) {
        const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM categorias WHERE nombre = ?", [cat.nombre.trim()]);
        if (existing.length > 0) { resolvedCategoryIds.push(existing[0].id); } 
        else {
          const [result] = await conn.query<ResultSetHeader>("INSERT INTO categorias (nombre) VALUES (?)", [cat.nombre.trim()]);
          resolvedCategoryIds.push(result.insertId);
        }
      }
    }
  }
  await conn.query("DELETE FROM producto_categorias WHERE producto_id = ?", [productId]);
  if (resolvedCategoryIds.length > 0) {
    const catValues = resolvedCategoryIds.map(catId => [productId, catId]);
    await conn.query("INSERT INTO producto_categorias (producto_id, categoria_id) VALUES ?", [catValues]);
  }
  await conn.query("DELETE FROM producto_proveedores WHERE producto_id = ?", [productId]);
  if (proveedores && proveedores.length > 0) {
    const provValues = proveedores.map((p) => [productId, p.id, p.es_principal || false]);
    await conn.query("INSERT INTO producto_proveedores (producto_id, proveedor_id, es_principal) VALUES ?", [provValues]);
  }
  await conn.query("DELETE FROM producto_imagenes WHERE producto_id = ?", [productId]);
  if (imagenes && imagenes.length > 0) {
      const imgValues = imagenes.map((url: string, index: number) => [productId, url, index === 0]);
      await conn.query("INSERT INTO producto_imagenes (producto_id, url, es_principal) VALUES ?", [imgValues]);
  }
  const [existingDbVariantes] = await conn.query<RowDataPacket[]>("SELECT id FROM variantes WHERE producto_id = ?", [productId]);
  const existingVariantIds = existingDbVariantes.map(v => v.id);
  const incomingVariantIds = variantes.map(v => v.id).filter(id => typeof id === 'number');
  const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));
  if (variantsToDelete.length > 0) {
      await conn.query("DELETE FROM variantes WHERE id IN (?)", [variantsToDelete]);
  }
  for (const variante of variantes) {
    let varianteId = variante.id;
    const variantData = [ 
        variante.nombre, variante.cantidad, JSON.stringify(variante.atributos || {}), 
        variante.costo_base_venta || 0, variante.precio_1 || 0, variante.precio_2 || 0, 
        variante.precio_3 || 0, variante.precio_4 || 0
    ];
    if (typeof varianteId === 'number') {
      await conn.query("UPDATE variantes SET nombre = ?, cantidad = ?, atributos = ?, costo_base_venta = ?, precio_1 = ?, precio_2 = ?, precio_3 = ?, precio_4 = ? WHERE id = ?", [...variantData, varianteId]);
    } else {
      const [result] = await conn.query<ResultSetHeader>("INSERT INTO variantes (producto_id, nombre, cantidad, atributos, costo_base_venta, precio_1, precio_2, precio_3, precio_4) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [productId, ...variantData]);
      varianteId = result.insertId;
    }
    await conn.query("DELETE FROM variante_codigos_barras WHERE variante_id = ?", [varianteId]);
    if (variante.codigos_barras && variante.codigos_barras.length > 0) {
        const barcodeValues = variante.codigos_barras.map(codigo => [varianteId, codigo]);
        await conn.query("INSERT INTO variante_codigos_barras (variante_id, codigo_barras) VALUES ?", [barcodeValues]);
    }
    await conn.query("DELETE FROM variante_imagenes WHERE variante_id = ?", [varianteId]);
    if (variante.imagenes && variante.imagenes.length > 0) {
        const varImgValues = variante.imagenes.map((url: string, index: number) => [varianteId, url, index === 0]);
        await conn.query("INSERT INTO variante_imagenes (variante_id, url, es_principal) VALUES ?", [varImgValues]);
    }
  }
}

// ... (Las rutas GET no cambian) ...
productosRouter.get('/', authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    let query = `${PRODUCTOS_QUERY}`;
    const params: string[] = [];
    if (search) {
      query += ` WHERE p.nombre LIKE ? OR m.nombre LIKE ?`
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ` GROUP BY p.id`;
    const [productos] = await pool.query<RowDataPacket[]>(query, params);
    res.json({ success: true, data: productos });
  } catch (error) {
    console.error("--- ERROR DETALLADO EN GET /api/productos ---", error);
    res.status(500).json({ success: false, message: "Error del servidor al obtener productos." });
  }
});

productosRouter.get('/lookup/:barcode', authenticate(['admin', 'maestro', 'operador', 'vendedor']), async (req: Request, res: Response) => {
    const { barcode } = req.params;
    try {
        const [variantCode] = await pool.query<RowDataPacket[]>("SELECT variante_id FROM variante_codigos_barras WHERE codigo_barras = ?", [barcode]);
        if (variantCode.length === 0) {
            return res.status(404).json({ success: false, message: "Código de barras no encontrado." });
        }
        const varianteId = variantCode[0].variante_id;
        const [variant] = await pool.query<RowDataPacket[]>("SELECT producto_id FROM variantes WHERE id = ?", [varianteId]);
        if (variant.length === 0) {
            return res.status(404).json({ success: false, message: "Variante no encontrada para el código de barras." });
        }
        const productoId = variant[0].producto_id;
        const [producto] = await pool.query<RowDataPacket[]>(`${PRODUCTOS_QUERY} WHERE p.id = ? GROUP BY p.id`, [productoId]);
        if (producto.length === 0) {
             return res.status(404).json({ success: false, message: "Producto no encontrado para la variante." });
        }
        res.json({ success: true, data: { ...producto[0], variante_encontrada_id: varianteId } });
    } catch (error) {
        console.error(`--- ERROR DETALLADO EN GET /api/productos/lookup/${barcode} ---`, error);
        res.status(500).json({ success: false, message: "Error del servidor al buscar por código de barras." });
    }
});

productosRouter.get('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    try {
        const [producto] = await pool.query<RowDataPacket[]>(`${PRODUCTOS_QUERY} WHERE p.id = ? GROUP BY p.id`, [req.params.id]);
        if (producto.length === 0) {
            return res.status(404).json({ success: false, message: "Producto no encontrado." });
        }
        res.json({ success: true, data: producto[0] });
    } catch (error) {
        console.error(`--- ERROR DETALLADO EN GET /api/productos/${req.params.id} ---`, error);
        res.status(500).json({ success: false, message: "Error del servidor al obtener el producto." });
    }
});

// --- MODIFICADO: Ruta POST con validación ---
productosRouter.post('/', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const validationErrors = validarProducto(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }

    const { nombre, descripcion, unidad_medida_base, marca, linea } = req.body as ProductoBody;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        let marcaId = marca?.id;
        if ((!marcaId || marcaId === 0) && marca?.nombre) {
            const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM marcas WHERE nombre = ?", [marca.nombre.trim()]);
            marcaId = existing.length > 0 ? existing[0].id : (await conn.query<ResultSetHeader>("INSERT INTO marcas (nombre, logo_url) VALUES (?, ?)", [marca.nombre.trim(), '']))[0].insertId;
        }
        let lineaId = linea?.id;
        if ((!lineaId || lineaId === 0) && linea?.nombre && marcaId) {
            const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM lineas_producto WHERE nombre = ? AND marca_id = ?", [linea.nombre.trim(), marcaId]);
            lineaId = existing.length > 0 ? existing[0].id : (await conn.query<ResultSetHeader>("INSERT INTO lineas_producto (nombre, marca_id) VALUES (?, ?)", [linea.nombre.trim(), marcaId]))[0].insertId;
        }
        let categoriaPrincipalId: number | null = null;
        if (nombre) {
            const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM categorias WHERE nombre = ?", [nombre.trim()]);
            categoriaPrincipalId = existing.length > 0 ? existing[0].id : (await conn.query<ResultSetHeader>("INSERT INTO categorias (nombre) VALUES (?)", [nombre.trim()]))[0].insertId;
        }
        if (!marcaId || !lineaId) { throw new Error("La marca y la línea son requeridas."); }
        const [result] = await conn.query<ResultSetHeader>( "INSERT INTO productos (nombre, descripcion, marca_id, linea_id, categoria_principal_id, unidad_medida_base) VALUES (?, ?, ?, ?, ?, ?)", [nombre, descripcion, marcaId, lineaId, categoriaPrincipalId, unidad_medida_base]);
        const productId = result.insertId;
        await updateRelations(conn, productId, req.body);
        const [newProduct] = await conn.query<RowDataPacket[]>(`${PRODUCTOS_QUERY} WHERE p.id = ? GROUP BY p.id`, [productId]);
        await conn.commit();
        res.status(201).json({ success: true, data: newProduct[0], message: "Producto creado exitosamente." });
    } catch (error) {
        await conn.rollback();
        console.error("--- ERROR DETALLADO EN POST /api/productos ---", error);
        res.status(500).json({ success: false, message: (error as Error).message || "Error del servidor al crear el producto." });
    } finally {
        conn.release();
    }
});

// --- MODIFICADO: Ruta PUT con validación ---
productosRouter.put('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const validationErrors = validarProducto(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({ success: false, message: validationErrors.join(' ') });
    }

    const productId = parseInt(req.params.id, 10);
    const { nombre, descripcion, unidad_medida_base, marca, linea } = req.body as ProductoBody;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        let marcaId = marca?.id;
        if ((!marcaId || marcaId === 0) && marca?.nombre) {
            const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM marcas WHERE nombre = ?", [marca.nombre.trim()]);
            marcaId = existing.length > 0 ? existing[0].id : (await conn.query<ResultSetHeader>("INSERT INTO marcas (nombre, logo_url) VALUES (?, ?)", [marca.nombre.trim(), '']))[0].insertId;
        }
        let lineaId = linea?.id;
        if ((!lineaId || lineaId === 0) && linea?.nombre && marcaId) {
            const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM lineas_producto WHERE nombre = ? AND marca_id = ?", [linea.nombre.trim(), marcaId]);
            lineaId = existing.length > 0 ? existing[0].id : (await conn.query<ResultSetHeader>("INSERT INTO lineas_producto (nombre, marca_id) VALUES (?, ?)", [linea.nombre.trim(), marcaId]))[0].insertId;
        }
        let categoriaPrincipalId: number | null = null;
        if (nombre) {
            const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM categorias WHERE nombre = ?", [nombre.trim()]);
            categoriaPrincipalId = existing.length > 0 ? existing[0].id : (await conn.query<ResultSetHeader>("INSERT INTO categorias (nombre) VALUES (?)", [nombre.trim()]))[0].insertId;
        }
        if (!marcaId || !lineaId) { throw new Error("La marca y la línea son requeridas."); }
        await conn.query( "UPDATE productos SET nombre = ?, descripcion = ?, marca_id = ?, linea_id = ?, categoria_principal_id = ?, unidad_medida_base = ? WHERE id = ?", [nombre, descripcion, marcaId, lineaId, categoriaPrincipalId, unidad_medida_base, productId] );
        await updateRelations(conn, productId, req.body);
        const [updatedProduct] = await conn.query<RowDataPacket[]>(`${PRODUCTOS_QUERY} WHERE p.id = ? GROUP BY p.id`, [productId]);
        await conn.commit();
        res.json({ success: true, data: updatedProduct[0], message: "Producto actualizado exitosamente." });
    } catch (error) {
        await conn.rollback();
        console.error(`--- ERROR DETALLADO EN PUT /api/productos/${productId} ---`, error);
        res.status(500).json({ success: false, message: (error as Error).message || "Error del servidor al actualizar el producto." });
    } finally {
        conn.release();
    }
});

productosRouter.delete('/:id', authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    try {
        // --- MODIFICADO: Se envuelve en una transacción para asegurar la integridad ---
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            // Eliminar relaciones primero para evitar errores de clave foránea
            await conn.query("DELETE FROM producto_categorias WHERE producto_id = ?", [req.params.id]);
            await conn.query("DELETE FROM producto_proveedores WHERE producto_id = ?", [req.params.id]);
            // Considerar qué hacer con las variantes, aquí se eliminarán en cascada si la BD está configurada así.
            // Si no, habría que eliminarlas manualmente.
            
            const [result] = await conn.query<ResultSetHeader>("DELETE FROM productos WHERE id = ?", [req.params.id]);
            if (result.affectedRows === 0) {
                await conn.rollback();
                return res.status(404).json({ success: false, message: "Producto no encontrado." });
            }
            await conn.commit();
            res.json({ success: true, message: "Producto eliminado exitosamente." });
        } catch(error) {
            await conn.rollback();
            throw error; // Re-lanzar para que el catch exterior lo maneje
        } finally {
            conn.release();
        }
    } catch (error: any) {
        console.error(`--- ERROR DETALLADO EN DELETE /api/productos/${req.params.id} ---`, error);
        // Error específico para cuando el producto no se puede borrar por estar en una venta, etc.
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'No se puede eliminar. El producto tiene ventas, compras u otros registros asociados.' });
        }
        res.status(500).json({ success: false, message: "Error del servidor al eliminar el producto." });
    }
});

export default productosRouter;