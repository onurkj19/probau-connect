import { cn } from "@/lib/utils";

type Status = "active" | "closed" | "pending" | "draft";

interface StatusBadgeProps {
  status: Status;
  label: string;
}

const statusStyles: Record<Status, string> = {
  active: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  closed: "border border-white/10 bg-white/5 text-zinc-400",
  pending: "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  draft: "border border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyles[status])}>
      {label}
    </span>
  );
}
