import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-zinc-200 bg-white/80 px-4 py-2 text-base shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-950 placeholder:text-zinc-400 focus-visible:border-[color:var(--primary)]/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-zinc-800 dark:bg-zinc-950/60 dark:file:text-zinc-50 dark:placeholder:text-zinc-500",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
