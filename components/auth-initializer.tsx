"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getMe } from "@/services/authService";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await getMe();
        const payload = data as any;
        setAuthData(payload.user || payload.data?.user || {}, payload.abilities || payload.data?.abilities || []);
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
  }, [setAuthData]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-t-transparent" />
          <p className="text-sm font-medium text-zinc-400">Loading Cinema OS...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
