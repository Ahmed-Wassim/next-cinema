import { api } from "@/lib/api";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  name?: string;
  [key: string]: unknown;
}

export const login = (data: Credentials) => api.post("/auth/login", data);
export const register = (data: RegisterPayload) =>
  api.post("/auth/register", data);
export const logout = () => api.post("/auth/logout");
