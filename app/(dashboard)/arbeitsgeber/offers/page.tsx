import { GroupedOffers } from "@/components/dashboard/grouped-offers";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listEmployerProjects, listOffersByProject } from "@/lib/api/projects";

const ArbeitsgeberOffersPage = async () => {
  const user = await getServerSessionUser();
  const projects = await listEmployerProjects(user?.id ?? "");

  const groups = await Promise.all(
    projects.map(async (project) => ({
      project,
      offers: await listOffersByProject(project.id),
    })),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Offers Received</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Private offer overview grouped by project.
        </p>
      </div>

      <GroupedOffers groups={groups} />
    </div>
  );
};

export default ArbeitsgeberOffersPage;
