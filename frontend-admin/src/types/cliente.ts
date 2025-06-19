export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo_documento: string;
  documento: string;
  fechaRegistro: Date;
  historialCompras: number;
  permite_credito: boolean;
  limite_credito: number;
}
