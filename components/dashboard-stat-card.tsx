"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardStatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  progress?: number;
  icon: LucideIcon;
  tone?: "primary" | "secondary" | "accent";
};

const toneClasses = {
  primary:
    "from-[color:var(--primary)]/18 via-[color:var(--primary)]/8 to-transparent text-[color:var(--primary)]",
  secondary:
    "from-[color:var(--secondary)]/20 via-[color:var(--secondary)]/10 to-transparent text-[color:var(--secondary)]",
  accent:
    "from-[color:var(--accent)]/22 via-[color:var(--accent)]/10 to-transparent text-[color:var(--accent)]",
} as const;

export function DashboardStatCard({
  label,
  value,
  hint,
  progress,
  icon: Icon,
  tone = "primary",
}: DashboardStatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden">
        <CardContent className="relative flex h-full flex-col gap-4 p-5">
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-90",
              toneClasses[tone],
            )}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                {label}
              </p>
              <motion.p
                key={String(value)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white"
              >
                {value}
              </motion.p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/80 p-3 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-white/5">
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <p className="relative text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {hint}
          </p>
          {typeof progress === "number" ? (
            <div className="relative mt-auto space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Completion</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    tone === "secondary"
                      ? "from-[color:var(--secondary)] to-cyan-300"
                      : tone === "accent"
                        ? "from-[color:var(--accent)] to-amber-200"
                        : "from-[color:var(--primary)] to-indigo-300",
                  )}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
