import { getTranslations } from "next-intl/server";

import { StatsCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listContractorOffers, listContractorProjects } from "@/lib/api/projects";

const UnternehmerOverviewPage = async () => {
  const t = await getTranslations("dashboard.contractor");
  const user = await getServerSessionUser();

  const [availableProjects, submittedOffers] = await Promise.all([
    listContractorProjects({ status: "active" }),
    listContractorOffers(user?.id ?? ""),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{t("overviewTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("overviewDescription")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label={t("availableProjects")} value={availableProjects.length} />
        <StatsCard label={t("submittedOffers")} value={submittedOffers.length} />
        <StatsCard
          label={t("subscriptionStatus")}
          value={user?.isSubscribed ? t("statusActive") : t("statusInactive")}
          hint={user?.plan ? t("planLabel", { plan: user.plan.toUpperCase() }) : t("noPlan")}
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">{t("currentAccessTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-600">{t("currentAccessDescription")}</p>
        </div>
        <StatusBadge status={user?.isSubscribed ? "subscribed" : "unsubscribed"} />
      </Card>
    </div>
  );
};

export default UnternehmerOverviewPage;
