import { api } from "@/lib/api";
import type { DiscountPayload } from "@/types/discount";

export interface DiscountListParams {
  page?: number;
  per_page?: number;
}

export const getDiscounts = (params?: DiscountListParams) =>
  api.get("/discounts", { params });

export const createDiscount = (data: DiscountPayload) =>
  api.post("/discounts", data);

export const updateDiscount = (id: number, data: Partial<DiscountPayload>) =>
  api.put(`/discounts/${id}`, data);

export const deleteDiscount = (id: number) => api.delete(`/discounts/${id}`);
