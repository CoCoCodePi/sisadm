import axios from 'axios';
import pool from '../db';

const TASA_MAX_DIFF = 2.0; // Máxima diferencia permitida vs tasa oficial

export const obtenerTasaBCV = async (): Promise<number> => {
  try {
    const response = await axios.get('https://api.bcv.org.ve/api/tasas');
    return parseFloat(response.data.usd);
  } catch (error) {
    console.error('Error al obtener tasa BCV:', error);
    throw new Error('No se pudo obtener tasa oficial');
  }
};

export const validarTasa = async (tasaIngresada: number): Promise<boolean> => {
  try {
    const tasaOficial = await obtenerTasaBCV();
    return Math.abs(tasaIngresada - tasaOficial) <= TASA_MAX_DIFF;
  } catch (error) {
    console.error('Usando tasa local como fallback');
    const [tasaLocal]: any[] = await pool.query(
      `SELECT tasa_usd 
      FROM historico_tasas 
      ORDER BY fecha DESC LIMIT 1`
    );
    return tasaLocal.length ? 
      Math.abs(tasaIngresada - tasaLocal[0].tasa_usd) <= TASA_MAX_DIFF : true;
  }
};