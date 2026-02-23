import { ProjectTable } from "@/components/dashboard/project-table";
import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listEmployerProjects } from "@/lib/api/projects";

const ArbeitsgeberProjectsPage = async () => {
  const user = await getServerSessionUser();
  const projects = await listEmployerProjects(user?.id ?? "");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">My Projects</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Monitor all projects with deadlines and status visibility.
        </p>
      </div>

      <Card>
        <ProjectTable projects={projects} basePath="/arbeitsgeber/projects" />
      </Card>
    </div>
  );
};

export default ArbeitsgeberProjectsPage;
