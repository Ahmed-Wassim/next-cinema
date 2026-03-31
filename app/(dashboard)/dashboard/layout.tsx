import { DashboardPageTransition } from "@/components/dashboard-page-transition";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <DashboardPageTransition>{children}</DashboardPageTransition>
    </DashboardShell>
  );
}
