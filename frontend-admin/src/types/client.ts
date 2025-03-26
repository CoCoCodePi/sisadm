export type Client = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo_documento: string; // Tipo de documento
  documento: string; // Número de documento
  fechaRegistro: Date;
  historialCompras: number;
};

export type ClientActivity = {
  id: string;
  fecha: string;
  tipo: "compra" | "servicio";
  descripcion: string;
  monto: number;
};
