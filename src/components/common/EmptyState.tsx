import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** `compact` for side panels, dropdowns, and dense table cells */
  size?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  size = "default",
}: EmptyStateProps) {
  const compact = size === "compact";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8 md:py-10" : "px-6 py-14 md:py-16",
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl border border-border/60 bg-muted/25 text-muted-foreground",
            compact ? "mb-3 h-10 w-10" : "mb-4 h-12 w-12",
          )}
        >
          <Icon
            className={cn("stroke-[1.35] opacity-65", compact ? "h-4 w-4" : "h-5 w-5")}
            aria-hidden
          />
        </div>
      ) : null}
      <p
        className={cn(
          "max-w-sm font-medium text-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {title}
      </p>
      {description ? (
        <p
          className={cn(
            "max-w-sm leading-relaxed text-muted-foreground",
            compact ? "mt-1 text-[11px]" : "mt-1.5 text-xs",
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-2",
            compact ? "mt-4" : "mt-6",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
