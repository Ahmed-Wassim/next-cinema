import Link from "next/link";

import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="shrink-0 md:min-h-full">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800 md:block">
          <Link
            href="/dashboard/movies"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Cinema dashboard
          </Link>
          <div className="md:hidden">
            <LogoutButton />
          </div>
        </div>
        <DashboardNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end border-b border-zinc-200 px-6 py-3 dark:border-zinc-800 md:flex">
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
