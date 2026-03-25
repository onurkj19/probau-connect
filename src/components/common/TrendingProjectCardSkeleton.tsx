import { Skeleton } from "@/components/ui/skeleton";

interface TrendingProjectCardSkeletonProps {
  count?: number;
}

/** Matches home trending project card layout (pill, title, meta strip, CTA). */
export function TrendingProjectCardSkeleton({ count = 3 }: TrendingProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="app-card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-28 rounded-full border-transparent bg-muted/35" />
            <Skeleton className="h-3 w-14 border-transparent bg-muted/35" />
          </div>
          <Skeleton className="h-6 w-[88%] border-transparent bg-muted/35" />
          <Skeleton className="h-4 w-[72%] border-transparent bg-muted/35" />
          <Skeleton className="h-14 w-full rounded-lg border-transparent bg-muted/35" />
          <Skeleton className="h-9 w-full rounded-lg border-transparent bg-muted/35" />
        </div>
      ))}
    </>
  );
}
