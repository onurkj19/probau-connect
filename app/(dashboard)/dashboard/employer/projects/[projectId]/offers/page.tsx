import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectById, listOffersByProject } from "@/lib/api/projects";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OffersByProjectPageProps {
  params: {
    projectId: string;
  };
}

const OffersByProjectPage = async ({ params }: OffersByProjectPageProps) => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const project = await getProjectById(params.projectId);
  if (!project || project.ownerId !== user.id) {
    notFound();
  }

  const projectOffers = await listOffersByProject(project.id);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-brand-900">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="mt-2 text-sm text-neutral-600">{project.description}</p>
      </div>

      <h2 className="text-xl font-semibold text-brand-900">Received offers ({projectOffers.length})</h2>

      {projectOffers.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No offers yet. Contractors will appear here once they submit.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projectOffers.map((offer) => (
            <Card key={offer.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-brand-900">{offer.contractorName}</h3>
                  <p className="text-sm text-neutral-500">Submitted on {formatDate(offer.submittedAtIso)}</p>
                </div>
                <p className="text-xl font-bold text-brand-900">{formatCurrency(offer.amountChf)}</p>
              </div>
              <p className="mt-3 text-sm text-neutral-600">{offer.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersByProjectPage;
