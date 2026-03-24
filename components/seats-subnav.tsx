"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items: { href: string; label: string; isActive: (pathname: string) => boolean }[] = [
  {
    href: "/dashboard/seats",
    label: "List",
    isActive: (p) => p === "/dashboard/seats",
  },
  {
    href: "/dashboard/seats/builder",
    label: "Bulk builder",
    isActive: (p) => p.startsWith("/dashboard/seats/builder"),
  },
  {
    href: "/dashboard/seats/layout",
    label: "Hall layout",
    isActive: (p) => p === "/dashboard/seats/layout",
  },
  {
    href: "/dashboard/seats/designer",
    label: "Designer",
    isActive: (p) => p.startsWith("/dashboard/seats/designer"),
  },
];

/** In-app navigation for everything under Seats (not shown in the main dashboard sidebar). */
export function SeatsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800"
      aria-label="Seats section"
    >
      {items.map(({ href, label, isActive }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            isActive(pathname)
              ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
