import { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/authMiddleware";

const categoriasRouter = require("express").Router();

// Obtener todas las categorías
categoriasRouter.get("/", authenticate(["admin", "maestro"]), async (req: Request, res: Response) => {
  try {
    const [categorias] = await pool.query("SELECT id, nombre FROM categorias");
    res.json({ success: true, data: categorias });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ success: false, message: errorMessage });
  }
});

// Crear una nueva categoría
categoriasRouter.post("/", authenticate(["admin"]), async (req: Request, res: Response) => {
  const { nombre } = req.body;
  try {
    const [result] = await pool.query("INSERT INTO categorias (nombre) VALUES (?)", [nombre]);
    res.status(201).json({ success: true, data: { id: (result as any).insertId, nombre } });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    if (error instanceof Error && error.message.includes("ER_DUP_ENTRY")) {
      return res.status(400).json({ success: false, message: "El nombre de la categoría ya existe" });
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ success: false, message: errorMessage });
  }
});

export default categoriasRouter;
