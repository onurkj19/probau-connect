import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/project";

export const StatusBadge = ({ status }: { status: ProjectStatus }) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
      status === "active"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-neutral-200 text-neutral-700",
    )}
  >
    {status === "active" ? "Active" : "Closed"}
  </span>
);
