import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getProjectById, listContractorOffers } from "@/lib/api/projects";
import { formatCurrency, formatDate } from "@/lib/utils";

const MyOffersPage = async () => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const contractorOffers = await listContractorOffers(user.id);

  const offersWithProject = await Promise.all(
    contractorOffers.map(async (offer) => ({
      offer,
      project: await getProjectById(offer.projectId),
    })),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">My offers</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Track all submitted proposals and review project context.
        </p>
      </div>

      {offersWithProject.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">
            No offers yet. Browse active projects to submit your first offer.
          </p>
          <Link href="/dashboard/contractor/projects" className="mt-3 inline-block text-sm font-semibold text-brand-900 underline">
            Browse projects
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {offersWithProject.map(({ offer, project }) => (
            <Card key={offer.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-brand-900">{project?.title ?? "Project unavailable"}</h2>
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

export default MyOffersPage;
