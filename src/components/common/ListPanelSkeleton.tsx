import { Skeleton } from "@/components/ui/skeleton";

interface ListPanelSkeletonProps {
  rows?: number;
  /** Two-line rows (title + meta) */
  variant?: "single" | "double";
}

/** Stacked rows inside a bordered panel (security events, activity feeds) */
export function ListPanelSkeleton({ rows = 6, variant = "double" }: ListPanelSkeletonProps) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-[min(12rem,45%)]" />
            <Skeleton className="h-3 w-14 shrink-0" />
          </div>
          {variant === "double" ? (
            <Skeleton className="mt-2 h-3 w-[min(20rem,85%)]" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
