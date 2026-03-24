import { api } from "@/lib/api";
import type { HallSection } from "@/types/hall-section";

export interface HallSectionListParams {
  page?: number;
  per_page?: number;
  hall_id?: number;
}

export const getHallSections = (params?: HallSectionListParams) =>
  api.get("/hall-sections", { params });

export const getHallSection = (id: number) =>
  api.get(`/hall-sections/${id}`);

export const createHallSection = (data: Omit<HallSection, "id">) =>
  api.post("/hall-sections", data);

export const updateHallSection = (
  id: number,
  data: Partial<Omit<HallSection, "id">>,
) => api.put(`/hall-sections/${id}`, data);

export const deleteHallSection = (id: number) =>
  api.delete(`/hall-sections/${id}`);
