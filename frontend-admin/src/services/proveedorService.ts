// src/services/proveedorService.ts
import apiClient from "../api/client";
import { Proveedor, ProveedorFormData } from "../types/proveedor";

export const getProveedores = async (
  search?: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "nombre",
  order: "ASC" | "DESC" = "ASC"
) => {
  const params = {
    search,
    page,
    limit,
    sort,
    order,
  };
  return apiClient.get<Proveedor[]>("/proveedores", { params });
};

export const createProveedor = async (proveedor: ProveedorFormData) => {
  const formattedProveedor = {
    ...proveedor,
    rif: `J-${proveedor.rif_suffix}`,
  };
  return apiClient.post<{ id: number }>("/proveedores", formattedProveedor);
};

export const updateProveedor = async (
  id: number,
  proveedor: ProveedorFormData
) => {
  return apiClient.put(`/proveedores/${id}`, proveedor);
};

export const deleteProveedor = async (id: number) => {
  return apiClient.delete(`/proveedores/${id}`);
};

export const exportProveedores = async (search?: string) => {
  return apiClient.get<string>("/proveedores/export", {
    params: { search },
    responseType: "blob",
  });
};
