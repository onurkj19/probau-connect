import { cn } from "@/lib/utils";

type Status = "active" | "closed" | "pending" | "draft";

interface StatusBadgeProps {
  status: Status;
  label: string;
}

const statusStyles: Record<Status, string> = {
  active: "bg-green-100 text-green-700",
  closed: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-700",
  draft: "bg-blue-100 text-blue-700",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyles[status])}>
      {label}
    </span>
  );
}
