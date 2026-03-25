import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, description, className }: StatsCardProps) {
  return (
    <div className={cn("app-card app-card--interactive", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          {description ? <p className="mt-2 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </div>
  );
}
