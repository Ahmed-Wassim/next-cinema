"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/branches", label: "Branches" },
  { href: "/dashboard/halls", label: "Halls" },
  { href: "/dashboard/price-tiers", label: "Price tiers" },
  { href: "/dashboard/seats", label: "Seats" },
  { href: "/dashboard/movies", label: "Movies" },
  { href: "/dashboard/showtimes", label: "Showtimes" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 border-b border-zinc-200 p-4 dark:border-zinc-800 md:w-56 md:border-b-0 md:border-r">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Tenant
      </p>
      {links.map(({ href, label }) => {
        const active =
          href === "/dashboard/seats"
            ? pathname === "/dashboard/seats" ||
              pathname.startsWith("/dashboard/seats/")
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
              active
                ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 dark:text-zinc-400",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
