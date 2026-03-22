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
      className={cn(
        "group rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-300" /> : null}
      </div>
      <p className={cn("mt-3 font-display text-3xl font-semibold text-white", valueClassName)}>{value}</p>
      {detail ? <p className="mt-2 text-xs text-slate-400">{detail}</p> : null}
    </article>
  );
}
