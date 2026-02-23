import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CountdownTimer } from "@/components/common/countdown-timer";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project } from "@/types/project";

export const ProjectCard = ({
  project,
  actions,
}: {
  project: Project;
  actions?: ReactNode;
}) => {
  const t = useTranslations("projects.card");

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={project.status} />
        <span className="text-xs text-neutral-500">{project.canton}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-brand-900">{project.title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{project.description}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500">{t("budget")}</dt>
          <dd className="font-semibold text-brand-900">{formatCurrency(project.budgetChf)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t("location")}</dt>
          <dd className="font-semibold text-brand-900">{project.location}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t("category")}</dt>
          <dd className="font-semibold text-brand-900">{project.category}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t("deadline")}</dt>
          <dd className="font-semibold text-brand-900">{formatDate(project.deadlineIso)}</dd>
        </div>
      </dl>

      {project.status === "active" ? <CountdownTimer deadlineIso={project.deadlineIso} /> : null}

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
};
