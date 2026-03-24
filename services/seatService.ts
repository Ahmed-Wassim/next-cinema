import { api } from "@/lib/api";
import type { BulkSeatItem } from "@/types/seat-bulk";
import type { Seat } from "@/types/seat";

export interface SeatListParams {
  page?: number;
  per_page?: number;
  hall_section_id?: number;
}

export const getSeats = (params?: SeatListParams) =>
  api.get("/seats", { params });

export const getSeat = (id: number) => api.get(`/seats/${id}`);

export const createSeat = (data: Omit<Seat, "id">) =>
  api.post("/seats", data);

export const updateSeat = (id: number, data: Partial<Omit<Seat, "id">>) =>
  api.put(`/seats/${id}`, data);

export const deleteSeat = (id: number) => api.delete(`/seats/${id}`);

export const bulkInsertSeats = (seats: BulkSeatItem[]) =>
  api.post("/seats/bulk", { seats });
