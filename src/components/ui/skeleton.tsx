import { cn } from "@/lib/utils";

/** Premium loading blocks: soft pulse, light border, frosted fill */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/40 motion-reduce:animate-none motion-safe:animate-skeleton-pulse supports-[backdrop-filter]:bg-muted/35",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
