import { AnalyticsNav } from "@/components/analytics-nav";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Horizontal Sub-navigation for Analytics */}
      <div className="border-b border-white/10 pb-4">
         <AnalyticsNav horizontal />
      </div>
      <div>
         {children}
      </div>
    </div>
  );
}
