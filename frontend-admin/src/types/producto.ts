// Contenido 100% Completo y FINAL para: src/types/producto.ts

import { Proveedor } from "./proveedor";

export interface Variante {
  id: number | string;
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

export interface Categoria {
  id: number | 0;
  nombre: string;
}
export interface Marca {
  id: number | 0;
  nombre: string;
}
export interface Linea {
  id: number | 0;
  nombre: string;
}
export interface UnidadMedida {
  id: number;
  nombre: string;
  simbolo: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: "activo" | "inactivo";
  unidad_medida_base: string;
  categoria_principal: Categoria | null;
  marca: Marca | null;
  linea: Linea | null;
  categorias_secundarias: Categoria[];
  proveedores: Proveedor[];
  imagenes: string[];
  variantes: Variante[];
}
