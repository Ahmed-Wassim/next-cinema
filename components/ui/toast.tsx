"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => onRemove(toast.id), 4500),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [toasts, onRemove]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 sm:right-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const icon =
            toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : toast.type === "error" ? (
              <AlertTriangle className="h-4 w-4 text-rose-300" />
            ) : (
              <Info className="h-4 w-4 text-sky-300" />
            );

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className={cn(
                "rounded-2xl border p-3 shadow-lg backdrop-blur-sm",
                toast.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : toast.type === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-100",
              )}
            >
              <div className="flex items-center gap-2 text-sm">
                {icon}
                <div>
                  <p className="font-semibold">{toast.title}</p>
                  <p className="text-xs opacity-80">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
