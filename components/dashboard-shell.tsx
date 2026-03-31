"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sectionLabels: Record<string, string> = {
  branches: "Branches",
  halls: "Halls",
  "price-tiers": "Price tiers",
  seats: "Seats",
  movies: "Movies",
  showtimes: "Showtimes",
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const currentSection = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const section = parts[1];
    return sectionLabels[section ?? ""] ?? "Dashboard";
  }, [pathname]);

  return (
    <div className="dashboard-shell relative flex flex-1 bg-transparent">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-10 h-64 w-64 rounded-full bg-[color:var(--primary)]/12 blur-3xl" />
        <div className="absolute right-[-10%] top-24 h-72 w-72 rounded-full bg-[color:var(--secondary)]/10 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[12%] h-72 w-72 rounded-full bg-[color:var(--accent)]/8 blur-3xl" />
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            aria-label="Close navigation"
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: collapsed ? 96 : 288,
          x: 0,
        }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        className={cn(
          "dashboard-sidebar fixed inset-y-4 left-4 z-50 hidden flex-col overflow-hidden rounded-[28px] md:flex",
          collapsed ? "items-center" : "items-stretch",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className={cn("min-w-0", collapsed && "sr-only")}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200/55">
              Cinema OS
            </p>
            <h1 className="mt-2 text-lg font-semibold text-white">
              Dashboard
            </h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand side menu" : "Collapse side menu"}
            title={collapsed ? "Expand side menu" : "Collapse side menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DashboardNav collapsed={collapsed} />
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="dashboard-sidebar-card rounded-3xl p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-[color:var(--accent)]/15 p-2 text-[color:var(--accent)]">
                <Sparkles className="h-4 w-4" />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-sm font-semibold text-white">
                    Live workspace
                  </p>
                  <p className="text-xs text-indigo-100/55">
                    Motion, metrics, and quick actions.
                  </p>
                </div>
              ) : null}
            </div>
            <div className={cn(collapsed && "flex justify-center")}>
              <LogoutButton />
            </div>
          </div>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            initial={{ x: -320, opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="dashboard-sidebar fixed inset-y-4 left-4 z-50 flex w-[min(84vw,20rem)] flex-col overflow-hidden rounded-[28px] md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200/55">
                  Cinema OS
                </p>
                <h1 className="mt-2 text-lg font-semibold text-white">
                  Dashboard
                </h1>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close side menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <DashboardNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-white/10 p-4">
              <LogoutButton />
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div
        className="relative flex min-w-0 flex-1 flex-col pl-0 md:pl-[var(--sidebar-offset)]"
        style={
          {
            "--sidebar-offset": `${collapsed ? 112 : 304}px`,
          } as CSSProperties
        }
      >
        <header className="sticky top-0 z-30 px-4 pt-4 md:px-6">
          <div className="cinema-surface flex items-center justify-between gap-3 rounded-[24px] px-4 py-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open side menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Current workspace
                </p>
                <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-white md:text-xl">
                  {currentSection}
                </h2>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="rounded-full border border-white/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:bg-white/5 dark:text-zinc-300">
                Primary: Indigo
              </div>
              <div className="rounded-full border border-white/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:bg-white/5 dark:text-zinc-300">
                Accent: Amber
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-6 pt-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
