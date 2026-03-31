"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/[0.06] dark:bg-white/[0.06]",
        "before:absolute before:inset-y-0 before:w-1/2 before:-translate-x-[140%] before:animate-shimmer-slide before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
