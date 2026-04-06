import { DashboardPageTransition } from "@/components/dashboard-page-transition";
import { DashboardShell } from "@/components/dashboard-shell";
import { AuthInitializer } from "@/components/auth-initializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthInitializer>
      <DashboardShell>
        <DashboardPageTransition>{children}</DashboardPageTransition>
      </DashboardShell>
    </AuthInitializer>
  );
}
