export type User = {
  id: string;
  email: string;
  nombre: string;
  rol: "maestro" | "admin" | "vendedor";
  password?: string; // Campo opcional
};
