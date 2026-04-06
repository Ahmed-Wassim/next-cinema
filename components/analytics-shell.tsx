"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, PanelLeftClose, PanelLeftOpen, LineChart } from "lucide-react";
import { usePathname } from "next/navigation";

import { AnalyticsNav } from "@/components/analytics-nav";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sectionLabels: Record<string, string> = {
  dashboard: "Analytics Overview",
  movies: "Movie Performance",
  revenue: "Revenue Metrics",
  customers: "Customer Insights",
};

export function AnalyticsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const currentSection = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const section = parts[1]; // /analytics/dashboard -> dashboard
    return sectionLabels[section ?? ""] ?? "Analytics";
  }, [pathname]);

  return (
    <div className="dashboard-shell relative flex flex-1 bg-zinc-950">
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--primary)]/80">
              Cinema OS
            </p>
            <h1 className="mt-2 text-lg font-semibold text-white">
              Data Insights
            </h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-white"
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
          <AnalyticsNav collapsed={collapsed} />
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="dashboard-sidebar-card rounded-3xl p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-[color:var(--primary)]/15 p-2 text-[color:var(--primary)]">
                <LineChart className="h-4 w-4" />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-sm font-semibold text-white">
                    Analytics Scope
                  </p>
                  <p className="text-xs text-zinc-400">
                    Tenant-wide metrics.
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

      <div
        className="relative flex min-w-0 flex-1 flex-col pl-0 md:pl-[var(--sidebar-offset)]"
        style={
          {
            "--sidebar-offset": `${collapsed ? 112 : 304}px`,
          } as CSSProperties
        }
      >
        <header className="sticky top-0 z-30 px-4 pt-4 md:px-6">
          <div className="cinema-surface flex items-center justify-between gap-3 rounded-[24px] px-4 py-4 md:px-6 bg-zinc-900/50 backdrop-blur-md border border-white/10">
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
                  Analytics Scope
                </p>
                <h2 className="truncate text-lg font-semibold text-zinc-100 md:text-xl">
                  {currentSection}
                </h2>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
                <div className="text-sm text-zinc-400">Powered by Go Service</div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-6 pt-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
