import { Skeleton } from "@/components/ui/skeleton";

interface NotificationListSkeletonProps {
  rows?: number;
}

export function NotificationListSkeleton({ rows = 6 }: NotificationListSkeletonProps) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded border-0 bg-muted/60" />
          <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded border-0 bg-muted/60" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 flex-1 max-w-md border-0 bg-muted/60" />
              <Skeleton className="h-3 w-24 shrink-0 border-0 bg-muted/60" />
            </div>
            <Skeleton className="h-3 w-full max-w-lg border-0 bg-muted/60" />
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg border-0 bg-muted/60" />
        </div>
      ))}
    </div>
  );
}
