"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Film, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Overview", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Movies", href: "/dashboard/analytics/movies", icon: Film },
  { title: "Revenue", href: "/dashboard/analytics/revenue", icon: DollarSign },
  { title: "Customers", href: "/dashboard/analytics/customers", icon: Users },
];

interface AnalyticsNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  horizontal?: boolean;
}

export function AnalyticsNav({ collapsed, onNavigate, horizontal }: AnalyticsNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(
       "flex gap-2",
       horizontal ? "flex-row overflow-x-auto pb-2" : "flex-col grid"
    )}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard/analytics"
            ? pathname === "/dashboard/analytics"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
              isActive
                ? "bg-[color:var(--primary)]/15 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
              collapsed && !horizontal && "justify-center px-0",
              horizontal && "whitespace-nowrap px-4"
            )}
            title={collapsed && !horizontal ? item.title : undefined}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-[color:var(--primary)]" : "text-zinc-500",
                (!collapsed || horizontal) && "mr-3",
              )}
            />
            {(!collapsed || horizontal) && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
