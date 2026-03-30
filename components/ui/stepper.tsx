"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStepIndex: number;
}

export function Stepper({ steps, currentStepIndex }: StepperProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        {steps.map((label, index) => {
          const isDone = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div key={label} className="flex-1 min-w-0">
              <div
                className={cn(
                  "mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                  isDone
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : isCurrent
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400",
                )}
              >
                {index + 1}
              </div>
              <p
                className={cn(
                  "text-center text-[11px] font-medium leading-tight",
                  isDone || isCurrent ? "text-white" : "text-zinc-500",
                )}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="relative mt-2 h-1 w-full bg-zinc-800 rounded-full">
        <div
          className="absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
