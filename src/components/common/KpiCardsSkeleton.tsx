import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardsSkeletonProps {
  /** Number of stat tiles (default 3) */
  count?: number;
  className?: string;
  /** Match admin metric grids (`dashboard-grid-3`, `dashboard-grid-4`, …) */
  gridClassName?: string;
}

/** Skeleton row for dashboard-style KPI / admin stat cards */
export function KpiCardsSkeleton({
  count = 3,
  className,
  gridClassName = "dashboard-grid-3",
}: KpiCardsSkeletonProps) {
  return (
    <div className={cn(gridClassName, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="app-card app-card--interactive space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-20 max-w-[8rem]" />
        </div>
      ))}
    </div>
  );
}
