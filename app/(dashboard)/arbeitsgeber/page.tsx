import { StatsCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listEmployerProjects, listOffersByProject } from "@/lib/api/projects";

const ArbeitsgeberOverviewPage = async () => {
  const user = await getServerSessionUser();

  const projects = await listEmployerProjects(user?.id ?? "");
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const closedProjects = projects.filter((project) => project.status === "closed").length;

  const offersByProject = await Promise.all(projects.map((project) => listOffersByProject(project.id)));
  const offersReceived = offersByProject.flat().length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Arbeitsgeber Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage project publications, deadlines, and incoming offers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Active Projects" value={activeProjects} />
        <StatsCard label="Closed Projects" value={closedProjects} />
        <StatsCard label="Offers Received" value={offersReceived} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Operational overview</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Track open tender windows and prioritize projects that need contractor evaluation.
        </p>
      </Card>
    </div>
  );
};

export default ArbeitsgeberOverviewPage;
