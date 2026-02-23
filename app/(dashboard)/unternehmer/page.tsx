import { StatsCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listContractorOffers, listContractorProjects } from "@/lib/api/projects";

const UnternehmerOverviewPage = async () => {
  const user = await getServerSessionUser();

  const [availableProjects, submittedOffers] = await Promise.all([
    listContractorProjects({ status: "active" }),
    listContractorOffers(user?.id ?? ""),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Unternehmer Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Track opportunities, offers, and subscription status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Available Projects" value={availableProjects.length} />
        <StatsCard label="Submitted Offers" value={submittedOffers.length} />
        <StatsCard
          label="Subscription Status"
          value={user?.isSubscribed ? "Active" : "Inactive"}
          hint={user?.plan ? `Plan: ${user.plan.toUpperCase()}` : "No active plan"}
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Current Access</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Offer submission requires an active subscription.
          </p>
        </div>
        <StatusBadge status={user?.isSubscribed ? "subscribed" : "unsubscribed"} />
      </Card>
    </div>
  );
};

export default UnternehmerOverviewPage;
