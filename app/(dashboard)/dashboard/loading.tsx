"use client";

import { DashboardStatCard } from "@/components/dashboard-stat-card";
import { DashboardTableSkeleton } from "@/components/dashboard-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, LayoutGrid, Sparkles } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="dashboard-content-grid">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-2xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label="Catalog"
          value="..."
          hint="Loading metrics"
          progress={72}
          icon={Clapperboard}
        />
        <DashboardStatCard
          label="Readiness"
          value="..."
          hint="Fetching dashboard health"
          progress={58}
          icon={LayoutGrid}
          tone="secondary"
        />
        <DashboardStatCard
          label="Experience"
          value="..."
          hint="Preparing responsive panels"
          progress={84}
          icon={Sparkles}
          tone="accent"
        />
      </div>

      <DashboardTableSkeleton rows={6} columns={4} />
    </div>
  );
}
