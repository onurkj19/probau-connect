import { getTranslations } from "next-intl/server";

import { UnternehmerProjectBrowser } from "@/components/dashboard/unternehmer-project-browser";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectFilters, listContractorProjects } from "@/lib/api/projects";

const UnternehmerProjectsPage = async () => {
  const t = await getTranslations("dashboard.contractor");
  const user = await getServerSessionUser();

  const [projects, filters] = await Promise.all([
    listContractorProjects(),
    getProjectFilters(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{t("browseTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("browseDescription")}</p>
      </div>

      <UnternehmerProjectBrowser
        projects={projects}
        cantons={filters.cantons}
        isSubscribed={Boolean(user?.isSubscribed)}
      />
    </div>
  );
};

export default UnternehmerProjectsPage;
