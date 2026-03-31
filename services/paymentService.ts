import { api } from "@/lib/api";

export interface PaymentListParams {
  page?: number;
  per_page?: number;
}

export const getPayments = (params?: PaymentListParams) =>
  api.get("/payments", { params });
