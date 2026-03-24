"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearAuthCookie } from "@/lib/auth-cookies";
import { logout } from "@/services/authService";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // still clear local session
    }
    localStorage.removeItem("token");
    clearAuthCookie();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
      Log out
    </Button>
  );
}
