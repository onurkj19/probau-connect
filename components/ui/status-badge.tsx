import { cn } from "@/lib/utils";
import type { OfferStatus, ProjectStatus } from "@/types/project";

type StatusValue = ProjectStatus | OfferStatus | "subscribed" | "unsubscribed";

const statusStyles: Record<StatusValue, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Closed", className: "bg-neutral-200 text-neutral-700" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  subscribed: { label: "Subscribed", className: "bg-brand-100 text-brand-900" },
  unsubscribed: { label: "Not subscribed", className: "bg-neutral-200 text-neutral-700" },
};

export const StatusBadge = ({ status }: { status: StatusValue }) => {
  const style = statusStyles[status];

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", style.className)}>
      {style.label}
    </span>
  );
};
