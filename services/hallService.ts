import { api } from "@/lib/api";
import type { Hall } from "@/types/hall";

export interface HallListParams {
  page?: number;
  per_page?: number;
  branch_id?: number;
}

export const getHalls = (params?: HallListParams) =>
  api.get("/halls", { params });

export const getHall = (id: number) => api.get(`/halls/${id}`);

export const createHall = (data: Omit<Hall, "id">) =>
  api.post("/halls", data);

export const updateHall = (id: number, data: Partial<Omit<Hall, "id">>) =>
  api.put(`/halls/${id}`, data);

export const deleteHall = (id: number) => api.delete(`/halls/${id}`);
