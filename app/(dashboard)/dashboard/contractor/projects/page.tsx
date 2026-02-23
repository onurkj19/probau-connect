import { redirect } from "next/navigation";

import { ContractorProjectBrowser } from "@/components/projects/contractor-project-browser";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectFilters, listContractorProjects } from "@/lib/api/projects";

const ContractorProjectsPage = async () => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [projects, options] = await Promise.all([
    listContractorProjects(),
    getProjectFilters(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Browse projects</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Filter opportunities by category, canton, and project status.
        </p>
      </div>

      <ContractorProjectBrowser
        user={user}
        projects={projects}
        categories={options.categories}
        cantons={options.cantons}
      />
    </div>
  );
};

export default ContractorProjectsPage;
