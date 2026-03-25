import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardSkeletonProps {
  count?: number;
}

/**
 * Skeleton blocks matching dashboard project card density and `app-card` radius.
 */
export function DashboardCardSkeleton({ count = 3 }: DashboardCardSkeletonProps) {
  return (
    <div className="grid gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="app-card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-44" />
            </div>
            <Skeleton className="h-9 w-24 shrink-0 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
