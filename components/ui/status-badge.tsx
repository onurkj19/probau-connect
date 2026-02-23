import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { OfferStatus, ProjectStatus } from "@/types/project";

export type StatusValue = ProjectStatus | OfferStatus | "subscribed" | "unsubscribed";

const statusStyles: Record<StatusValue, { labelKey: string; className: string }> = {
  active: { labelKey: "active", className: "bg-emerald-100 text-emerald-700" },
  closed: { labelKey: "closed", className: "bg-neutral-200 text-neutral-700" },
  pending: { labelKey: "pending", className: "bg-amber-100 text-amber-700" },
  accepted: { labelKey: "accepted", className: "bg-emerald-100 text-emerald-700" },
  rejected: { labelKey: "rejected", className: "bg-red-100 text-red-700" },
  subscribed: { labelKey: "subscribed", className: "bg-brand-100 text-brand-900" },
  unsubscribed: { labelKey: "unsubscribed", className: "bg-neutral-200 text-neutral-700" },
};

export const StatusBadge = ({ status }: { status: StatusValue }) => {
  const t = useTranslations("common.status");
  const style = statusStyles[status];

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", style.className)}>
      {t(style.labelKey)}
    </span>
  );
};
