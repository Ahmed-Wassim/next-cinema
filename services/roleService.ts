import { api } from "@/lib/api";

export interface RoleListParams {
  page?: number;
  per_page?: number;
}

export const getPermissions = () => api.get("/permissions");

export const getRoles = (params?: RoleListParams) =>
  api.get("/roles", { params });

export const getRole = (id: number) => api.get(`/roles/${id}`);

export const createRole = (data: { name: string; permissions?: number[] }) =>
  api.post("/roles", data);

export const updateRole = (
  id: number,
  data: { name: string; permissions?: number[] },
) => api.put(`/roles/${id}`, data);

export const deleteRole = (id: number) => api.delete(`/roles/${id}`);
