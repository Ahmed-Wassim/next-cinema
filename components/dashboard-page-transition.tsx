"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function DashboardPageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(6px)" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
