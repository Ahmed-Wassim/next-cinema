"use client";

import { useAuthStore } from "@/stores/auth-store";

interface CanProps {
  permission: string;
  children: React.ReactNode;
}

export function Can({ permission, children }: CanProps) {
  const abilities = useAuthStore((state) => state.abilities);

  if (abilities.includes(permission)) {
    return <>{children}</>;
  }

  return null;
}
