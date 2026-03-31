import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50",
        outline: "text-zinc-950 dark:text-zinc-50",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
        destructive:
          "border-transparent bg-red-500/15 text-red-700 hover:bg-red-500/20 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
