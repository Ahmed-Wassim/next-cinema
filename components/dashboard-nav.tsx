"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Armchair,
  Building2,
  Clapperboard,
  BarChart3,
  Percent,
  MapPinned,
  ReceiptText,
  Tags,
  Ticket,
  Users,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Can } from "@/components/can";

const links = [
  { href: "/dashboard/users", label: "Users", icon: Users, permission: "user-view" },
  { href: "/dashboard/roles", label: "Roles", icon: ShieldCheck, permission: "role-view" },
  { href: "/dashboard/branches", label: "Branches", icon: MapPinned, permission: "branch-view" },
  { href: "/dashboard/halls", label: "Halls", icon: Building2, permission: "hall-view" },
  { href: "/dashboard/price-tiers", label: "Price tiers", icon: Tags, permission: "price-tier-view" },
  { href: "/dashboard/seats", label: "Seats", icon: Armchair, permission: "seat-view" },
  { href: "/dashboard/movies", label: "Movies", icon: Clapperboard, permission: "movie-view" },
  { href: "/dashboard/showtimes", label: "Showtimes", icon: Ticket, permission: "showtime-view" },
  { href: "/dashboard/discounts", label: "Discounts", icon: Percent, permission: "discount-view" },
  { href: "/dashboard/payments", label: "Payments", icon: ReceiptText, permission: "payment-view" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, permission: "analytics-view" },
];

export function DashboardNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      <p
        className={cn(
          "mb-2 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100/45",
          collapsed && "text-center",
        )}
      >
        Tenant
      </p>
      {links.map(({ href, label, icon: Icon, permission }) => {
        const active =
          href === "/dashboard/seats"
            ? pathname === "/dashboard/seats" ||
              pathname.startsWith("/dashboard/seats/")
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Can key={href} permission={permission}>
            <Link
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5",
                active
                  ? "bg-white/10 text-white shadow-[0_14px_30px_rgba(2,6,23,0.34)]"
                  : "text-indigo-100/62 hover:bg-white/6 hover:text-white",
                collapsed && "justify-center px-2",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="dashboard-nav-active"
                  className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-r from-[color:var(--primary)]/22 via-white/8 to-transparent"
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 rounded-xl p-2",
                  active
                    ? "bg-white/12 text-white shadow-sm"
                    : "bg-transparent text-indigo-100/55 group-hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {!collapsed ? <span className="relative z-10">{label}</span> : null}
            </Link>
          </Can>
        );
      })}
    </nav>
  );
}
