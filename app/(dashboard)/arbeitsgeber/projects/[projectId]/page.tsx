import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectById, listOffersByProject } from "@/lib/api/projects";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ProjectDetailPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const ArbeitsgeberProjectDetailPage = async ({ params }: ProjectDetailPageProps) => {
  const routeParams = await params;
  const user = await getServerSessionUser();
  const project = await getProjectById(routeParams.projectId);

  if (!project || project.ownerId !== user?.id) {
    notFound();
  }

  const projectOffers = await listOffersByProject(project.id);

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-brand-900">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-sm text-neutral-600">{project.description}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-neutral-500">Location</p>
            <p className="font-semibold text-brand-900">{project.location}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Deadline</p>
            <p className="font-semibold text-brand-900">{formatDate(project.deadlineIso)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Budget</p>
            <p className="font-semibold text-brand-900">{formatCurrency(project.budgetChf)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Offers for this project</h2>
        <p className="mt-1 text-sm text-neutral-600">{projectOffers.length} offers received.</p>
      </Card>
    </div>
  );
};

export default ArbeitsgeberProjectDetailPage;
