import { getTranslations } from "next-intl/server";

import { StatsCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listEmployerProjects, listOffersByProject } from "@/lib/api/projects";

const ArbeitsgeberOverviewPage = async () => {
  const t = await getTranslations("dashboard.employer");
  const user = await getServerSessionUser();

  const projects = await listEmployerProjects(user?.id ?? "");
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const closedProjects = projects.filter((project) => project.status === "closed").length;

  const offersByProject = await Promise.all(projects.map((project) => listOffersByProject(project.id)));
  const offersReceived = offersByProject.flat().length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{t("overviewTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("overviewDescription")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label={t("activeProjects")} value={activeProjects} />
        <StatsCard label={t("closedProjects")} value={closedProjects} />
        <StatsCard label={t("offersReceived")} value={offersReceived} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">{t("operationalTitle")}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t("operationalDescription")}</p>
      </Card>
    </div>
  );
};

export default ArbeitsgeberOverviewPage;
