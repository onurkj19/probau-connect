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
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_80px_-40px_rgba(30,41,59,0.8)] backdrop-blur-md transition-colors duration-200 hover:border-white/20",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className={cn("mt-6", contentClassName)}>{children}</div>
    </section>
  );
}
