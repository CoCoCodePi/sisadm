// src/types/proveedor.ts

// ESTE ES AHORA NUESTRO ÚNICO TIPO PARA PROVEEDOR
export type Proveedor = {
  id: number;
  nombre: string;
  rif: string;
  telefono: string;
  direccion: string;
  contacto_nombre: string;
  email?: string;
  dias_credito: number;
  cuenta_bancaria?: string;

  // CORRECCIÓN FINAL: La propiedad es opcional en el tipo base.
  es_principal?: boolean;
};

export type ProveedorFormData = Omit<Proveedor, "id"> & {
  rif_suffix: string;
};
