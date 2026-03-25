import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AdminPanelCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminPanelCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: AdminPanelCardProps) {
  return (
    <section className={cn("app-card app-card--interactive", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className={cn("mt-6", contentClassName)}>{children}</div>
    </section>
  );
}
