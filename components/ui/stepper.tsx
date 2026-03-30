"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStepIndex: number;
}

export function Stepper({ steps, currentStepIndex }: StepperProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[26px] border border-[var(--panel-border)] bg-[var(--panel-bg)] p-4 shadow-[0_20px_50px_rgba(2,6,23,0.28)] sm:p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-center justify-between gap-2">
        {steps.map((label, index) => {
          const isDone = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <motion.div
              key={label}
              className="flex-1 min-w-0"
              initial={{ opacity: 0.7, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <motion.div
                className={cn(
                  "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                  isDone
                    ? "border-emerald-400/50 bg-emerald-500/18 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
                    : isCurrent
                      ? "cinema-ring border-[var(--accent)]/55 bg-[var(--accent)]/14 text-[var(--accent-soft)]"
                      : "border-white/8 bg-white/5 text-[var(--text-muted)]",
                )}
                animate={isCurrent ? { scale: 1.06 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {index + 1}
              </motion.div>
              <motion.p
                className={cn(
                  "text-center text-[11px] font-medium leading-tight transition-colors duration-300",
                  isDone || isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
                )}
                animate={isCurrent ? { opacity: 1 } : { opacity: 0.82 }}
              >
                {label}
              </motion.p>
            </motion.div>
          );
        })}
      </div>
      <div className="relative mt-3 h-1.5 w-full rounded-full bg-white/8">
        <motion.div
          className="absolute left-0 top-0 h-1.5 rounded-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent-hover)] to-emerald-400 transition-all duration-500"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          initial={false}
          animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
        />
      </div>
    </motion.div>
  );
}
