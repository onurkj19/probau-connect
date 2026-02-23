import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, ProjectOffer } from "@/types/project";

interface OfferGroup {
  project: Project;
  offers: ProjectOffer[];
}

export const GroupedOffers = ({ groups }: { groups: OfferGroup[] }) => {
  const tDashboard = useTranslations("dashboard.shared");
  const tProjects = useTranslations("projects.groupedOffers");

  return (
    <div className="space-y-4">
      {groups.map(({ project, offers }) => (
        <Card key={project.id} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-brand-900">{project.title}</h2>
            <StatusBadge status={project.status} />
          </div>
          {offers.length === 0 ? (
            <p className="text-sm text-neutral-600">{tDashboard("noOffersForProject")}</p>
          ) : (
            <ul className="space-y-3">
              {offers.map((offer) => (
                <li key={offer.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-brand-900">{offer.contractorName}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={offer.status} />
                      <span className="font-semibold text-brand-900">{formatCurrency(offer.amountChf)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{offer.message}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {tProjects("submittedOn", { date: formatDate(offer.submittedAtIso) })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
};
