import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectById, listContractorOffers } from "@/lib/api/projects";
import { formatCurrency, formatDate } from "@/lib/utils";

const UnternehmerOffersPage = async () => {
  const t = await getTranslations("dashboard.contractor");
  const user = await getServerSessionUser();
  const offers = await listContractorOffers(user?.id ?? "");

  const offersWithProjects = await Promise.all(
    offers.map(async (offer) => ({
      offer,
      project: await getProjectById(offer.projectId),
    })),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{t("offersTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("offersDescription")}</p>
      </div>

      <div className="space-y-3">
        {offersWithProjects.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-600">{t("noOffersYet")}</p>
          </Card>
        ) : (
          offersWithProjects.map(({ offer, project }) => (
            <Card key={offer.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-brand-900">
                    {project?.title ?? t("projectUnavailable")}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">{offer.message}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-900">{formatCurrency(offer.amountChf)}</p>
                  <p className="text-xs text-neutral-500">{formatDate(offer.submittedAtIso)}</p>
                </div>
              </div>
              <div className="mt-3">
                <StatusBadge status={offer.status} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UnternehmerOffersPage;
