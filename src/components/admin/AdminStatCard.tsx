import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminStatCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: LucideIcon;
  valueClassName?: string;
  className?: string;
}

export function AdminStatCard({
  label,
  value,
  detail,
  icon: Icon,
  valueClassName,
  className,
}: AdminStatCardProps) {
  return (
    <article
      className={cn("app-card app-card--interactive", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tabular-nums", valueClassName)}>{value}</p>
      {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
    </article>
  );
}
