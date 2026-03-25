import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-side actions (filters, buttons). */
  actions?: React.ReactNode;
  /** Align title block and actions on the row axis (e.g. admin toolbars). */
  align?: "start" | "end";
  className?: string;
}

/**
 * Consistent page chrome: `.page-title` + `.page-subtitle` with optional actions.
 */
export function PageHeader({ title, description, actions, align = "start", className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-6",
        align === "end" ? "sm:items-end" : "sm:items-start",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="page-title">{title}</h1>
        {description != null ? <div className="page-subtitle">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
