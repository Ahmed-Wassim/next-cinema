import type { Role } from "./role";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  roles?: Role[];
}
