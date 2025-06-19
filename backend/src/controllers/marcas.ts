import { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/authMiddleware";
import { uploadToStorage, deleteFromStorage } from "../services/storage";
import { ResultSetHeader } from "mysql2";

const marcasRouter = require("express").Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Obtener todas las marcas
marcasRouter.get("/", async (req: Request, res: Response) => {
  try {
    const [marcas] = await pool.query(`
      SELECT m.id, m.nombre
      FROM marcas m
      ORDER BY m.nombre ASC
    `);
    res.json({ success: true, data: marcas });
  } catch (error) {
    console.error("--- ERROR EN GET /api/marcas ---", error);
    res.status(500).json({ success: false, message: "Error obteniendo marcas" });
  }
});

// Obtener detalles de una marca (incluyendo banners)
marcasRouter.get("/:id/details", authenticate(['admin', 'maestro']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [marcaDetails] = await pool.query(`
            SELECT m.*, 
              (SELECT JSON_ARRAYAGG(
                JSON_OBJECT('id', mb.id, 'tipo', mb.tipo, 'url', mb.url_imagen, 'orden', mb.orden, 'activo', mb.activo)
              ) FROM marca_banners mb WHERE m.id = mb.marca_id) AS banners
            FROM marcas m
            WHERE m.id = ?
        `, [id]);
        
        if ((marcaDetails as any).length === 0) {
            return res.status(404).json({ success: false, message: "Marca no encontrada" });
        }
        res.json({ success: true, data: (marcaDetails as any)[0] });
    } catch (error) {
        console.error(`--- ERROR EN GET /api/marcas/${id}/details ---`, error);
        res.status(500).json({ success: false, message: "Error obteniendo detalles de la marca" });
    }
});


// Obtener líneas de una marca específica
marcasRouter.get("/:id/lineas", authenticate(['admin', 'maestro', 'operador']), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [lineas] = await pool.query(
            "SELECT id, nombre FROM lineas_producto WHERE marca_id = ?",
            [id]
        );
        res.json({ success: true, data: lineas });
    } catch (error) {
        console.error(`--- ERROR EN GET /api/marcas/${id}/lineas ---`, error);
        res.status(500).json({ success: false, message: 'Error obteniendo líneas de producto' });
    }
});

// Crear nueva marca con uploads
marcasRouter.post(
  "/",
  authenticate(["admin", "maestro"]),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banners", maxCount: 5 }
  ]),
  async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { nombre, bannerType } = req.body;
      const files = req.files as { [key: string]: Express.Multer.File[] };

      if (!nombre) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: "El nombre de la marca es requerido." });
      }
      
      let logoUrl = '';
      if (files && files["logo"]) {
          logoUrl = await uploadToStorage(files["logo"][0], "marcas/logos");
      }
      
      const [marcaResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO marcas (nombre, logo_url, banner_type) VALUES (?, ?, ?)`,
        [nombre, logoUrl, bannerType || 'static']
      );
      const marcaId = marcaResult.insertId;

      if (files && files["banners"]) {
        await Promise.all(
          files["banners"].map(async (file, index) => {
            const bannerUrl = await uploadToStorage(file, "marcas/banners");
            await conn.query(
              `INSERT INTO marca_banners (marca_id, url_imagen, orden) VALUES (?, ?, ?)`,
              [marcaId, bannerUrl, index + 1]
            );
          })
        );
      }
      await conn.commit();
      res.status(201).json({ success: true, data: { id: marcaId } });
    } catch (error: any) {
      await conn.rollback();
       if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'El nombre de esta marca ya existe.' });
      }
      console.error("--- ERROR EN POST /api/marcas ---", error);
      res.status(500).json({ success: false, message: "Error creando marca" });
    } finally {
      conn.release();
    }
  }
);

// Actualizar una marca
marcasRouter.put(
  "/:id",
  authenticate(["admin", "maestro"]),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banners", maxCount: 5 }
  ]),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { nombre, bannerType, bannersToDelete } = req.body;
      const files = req.files as { [key: string]: Express.Multer.File[] };

      let updateQuery = `UPDATE marcas SET nombre = ?, banner_type = ?`;
      const updateParams: any[] = [nombre, bannerType];

      if (files["logo"]) {
        const logoUrl = await uploadToStorage(files["logo"][0], "marcas/logos");
        updateQuery += `, logo_url = ?`;
        updateParams.push(logoUrl);
      }
      updateQuery += ` WHERE id = ?`;
      updateParams.push(id);
      await conn.query(updateQuery, updateParams);

      if (bannersToDelete && bannersToDelete.length > 0) {
        const bannersToDeleteArray = JSON.parse(bannersToDelete);
        await Promise.all(
          bannersToDeleteArray.map(async (url: string) => {
            await deleteFromStorage(url);
            await conn.query(`DELETE FROM marca_banners WHERE url_imagen = ?`, [url]);
          })
        );
      }

      if (files["banners"]) {
        await Promise.all(
          files["banners"].map(async (file, index) => {
            const bannerUrl = await uploadToStorage(file, "marcas/banners");
            await conn.query(
              `INSERT INTO marca_banners (marca_id, url_imagen, orden) VALUES (?, ?, ?)`,
              [id, bannerUrl, index + 1]
            );
          })
        );
      }

      await conn.commit();
      res.json({ success: true, message: "Marca actualizada correctamente" });
    } catch (error) {
      await conn.rollback();
      console.error(`--- ERROR EN PUT /api/marcas/${id} ---`, error);
      res.status(500).json({ success: false, message: "Error actualizando marca" });
    } finally {
      conn.release();
    }
  }
);

// Eliminar una marca
marcasRouter.delete("/:id", authenticate(["admin"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result]: any[] = await conn.query(
      `SELECT logo_url, (SELECT JSON_ARRAYAGG(url_imagen) FROM marca_banners WHERE marca_id = ?) AS banners FROM marcas WHERE id = ?`,
      [id, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Marca no encontrada" });
    }
    const { logo_url, banners } = result[0];
    if (logo_url) await deleteFromStorage(logo_url);

    if (banners) {
      const bannerUrls = JSON.parse(banners);
      await Promise.all( bannerUrls.map(async (url: string) => await deleteFromStorage(url)) );
    }

    await conn.query(`DELETE FROM marca_banners WHERE marca_id = ?`, [id]);
    await conn.query(`DELETE FROM marcas WHERE id = ?`, [id]);

    await conn.commit();
    res.json({ success: true, message: "Marca eliminada correctamente" });
  } catch (error) {
    await conn.rollback();
    console.error(`--- ERROR EN DELETE /api/marcas/${id} ---`, error);
    res.status(500).json({ success: false, message: "Error eliminando marca" });
  } finally {
    conn.release();
  }
});

export default marcasRouter;