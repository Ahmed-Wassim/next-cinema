import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:scale-[0.98] dark:focus-visible:ring-offset-zinc-950 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white hover:shadow-[0_16px_36px_color-mix(in_srgb,var(--primary)_28%,transparent)]",
        destructive:
          "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_16px_36px_rgba(244,63,94,0.24)]",
        outline:
          "border border-zinc-200 bg-white/80 text-zinc-900 shadow-none hover:border-[color:var(--primary)]/35 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:bg-zinc-900",
        secondary:
          "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-white/10 dark:hover:bg-white/15",
        ghost:
          "bg-transparent text-zinc-600 shadow-none hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
        link: "text-[color:var(--primary)] shadow-none underline-offset-4 hover:text-[color:var(--secondary)] hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
