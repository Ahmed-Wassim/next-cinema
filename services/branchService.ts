import { api } from "@/lib/api";
import type { Branch } from "@/types/branch";

export interface BranchListParams {
  page?: number;
  per_page?: number;
}

export const getBranches = (params?: BranchListParams) =>
  api.get("/branches", { params });

export const getBranch = (id: number) => api.get(`/branches/${id}`);

export const createBranch = (data: Omit<Branch, "id">) =>
  api.post("/branches", data);

export const updateBranch = (id: number, data: Partial<Omit<Branch, "id">>) =>
  api.put(`/branches/${id}`, data);

export const deleteBranch = (id: number) => api.delete(`/branches/${id}`);
