import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTableSkeleton({
  rows = 6,
  columns = 4,
  withHeader = true,
}: {
  rows?: number;
  columns?: number;
  withHeader?: boolean;
}) {
  return (
    <Card>
      {withHeader ? (
        <CardHeader className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={`head-${index}`} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-3 rounded-2xl border border-white/5 p-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className="h-5 w-full"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
