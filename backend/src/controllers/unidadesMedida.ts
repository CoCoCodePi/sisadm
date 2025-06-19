import { Request, Response } from "express";
import pool from "../db";

const unidadesRouter = require("express").Router();

// Obtener todas las unidades de medida
unidadesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const [unidades] = await pool.query("SELECT * FROM unidades_medida");
    res.json({ success: true, data: unidades });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error obteniendo unidades de medida",
      error: (error as Error).message
    });
  }
});

// Crear nueva unidad de medida
unidadesRouter.post("/", async (req: Request, res: Response) => {
  const { nombre, simbolo } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO unidades_medida (nombre, simbolo) VALUES (?, ?)",
      [nombre, simbolo]
    );
    res.status(201).json({ success: true, data: { id: (result as any).insertId } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creando unidad de medida",
      error: (error as Error).message
    });
  }
});

export default unidadesRouter;