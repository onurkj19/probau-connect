import { Skeleton } from "@/components/ui/skeleton";

export function AdminAnalyticsSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="dashboard-grid-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-panel-compact space-y-2">
            <Skeleton className="h-3 w-24 border-0 bg-muted/60" />
            <Skeleton className="h-8 w-16 border-0 bg-muted/60" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="app-card space-y-3">
            <Skeleton className="h-4 w-40 border-0 bg-muted/60" />
            <Skeleton className="h-[220px] w-full rounded-xl border-0 bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
