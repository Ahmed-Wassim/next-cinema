import { api } from "@/lib/api";
import type { User } from "@/types/user";

export interface UserListParams {
  page?: number;
  per_page?: number;
}

export const getUsers = (params?: UserListParams) =>
  api.get("/users", { params });

export const getUser = (id: number) => api.get(`/users/${id}`);

export const createUser = (
  data: Omit<Partial<User>, "roles"> & { password?: string; roles?: number[] },
) => api.post("/users", data);

export const updateUser = (
  id: number,
  data: Omit<Partial<User>, "roles"> & { password?: string; roles?: number[] },
) => api.put(`/users/${id}`, data);

export const deleteUser = (id: number) => api.delete(`/users/${id}`);
