import { api } from "@/lib/api";
import type { PriceTier } from "@/types/price-tier";

export interface PriceTierListParams {
  page?: number;
  per_page?: number;
  hall_id?: number;
}

export const getPriceTiers = (params?: PriceTierListParams) =>
  api.get("/price-tiers", { params });

export const getPriceTier = (id: number) => api.get(`/price-tiers/${id}`);

export const createPriceTier = (
  data: Omit<PriceTier, "id">,
) => api.post("/price-tiers", data);

export const updatePriceTier = (
  id: number,
  data: Partial<Omit<PriceTier, "id">>,
) => api.put(`/price-tiers/${id}`, data);

export const deletePriceTier = (id: number) =>
  api.delete(`/price-tiers/${id}`);
