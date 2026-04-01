import { api } from "@/lib/api";
import type { Showtime } from "@/types/showtime";

export interface ShowtimeListParams {
  page?: number;
  per_page?: number;
}

export const getShowtimes = (params?: ShowtimeListParams) =>
  api.get("/showtimes", { params });

export const getShowtime = (id: number) => api.get(`/showtimes/${id}`);

export const createShowtime = (data: Omit<Showtime, "id">) =>
  api.post("/showtimes", data);

export const updateShowtime = (
  id: number,
  data: Partial<Omit<Showtime, "id">>,
) => api.put(`/showtimes/${id}`, data);

export const deleteShowtime = (id: number) =>
  api.delete(`/showtimes/${id}`);

export const setShowtimeOffer = (id: number, offer_percentage: number) =>
  api.patch(`/showtimes/${id}/offer`, { offer_percentage });

export const clearShowtimeOffer = (id: number) =>
  api.delete(`/showtimes/${id}/offer`);
