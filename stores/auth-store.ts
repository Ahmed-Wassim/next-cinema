import { create } from "zustand";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

interface AuthState {
  user: UserProfile | null;
  abilities: string[];
  setAuthData: (user: UserProfile, abilities: string[]) => void;
  clearAuthData: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  abilities: [],
  setAuthData: (user, abilities) => set({ user, abilities }),
  clearAuthData: () => set({ user: null, abilities: [] }),
}));
