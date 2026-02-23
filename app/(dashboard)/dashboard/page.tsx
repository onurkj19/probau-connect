import Link from "next/link";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import {
  listContractorOffers,
  listContractorProjects,
  listEmployerProjects,
  listOffersByProject,
} from "@/lib/api/projects";

const DashboardOverviewPage = async () => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "employer") {
    const projects = await listEmployerProjects(user.id);
    const activeProjects = projects.filter((project) => project.status === "active");
    const offersPerProject = await Promise.all(projects.map((project) => listOffersByProject(project.id)));
    const totalOffers = offersPerProject.flat().length;

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">Arbeitsgeber dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage tenders, review offers, and keep project deadlines in control.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="My projects" value={projects.length} />
          <StatCard label="Active projects" value={activeProjects.length} />
          <StatCard label="Received offers" value={totalOffers} />
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/dashboard/employer/create-project" className="font-semibold text-brand-900 underline">
              Create new project
            </Link>
            <Link href="/dashboard/employer/projects" className="font-semibold text-brand-900 underline">
              View all projects
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const [projects, offers] = await Promise.all([
    listContractorProjects({ status: "active" }),
    listContractorOffers(user.id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Unternehmer dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Track opportunities, submit offers, and manage your subscription.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open projects" value={projects.length} />
        <StatCard label="My submitted offers" value={offers.length} />
        <StatCard
          label="Subscription"
          value={user.isSubscribed ? "Active" : "Inactive"}
          hint={user.plan ? `Current plan: ${user.plan.toUpperCase()}` : undefined}
        />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/contractor/projects" className="font-semibold text-brand-900 underline">
            Browse projects
          </Link>
          <Link href="/dashboard/contractor/subscription" className="font-semibold text-brand-900 underline">
            Manage subscription
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default DashboardOverviewPage;
