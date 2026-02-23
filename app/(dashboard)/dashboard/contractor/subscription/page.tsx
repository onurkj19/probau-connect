import { redirect } from "next/navigation";

import { SubscriptionManagement } from "@/components/subscription/subscription-management";
import { Card } from "@/components/ui/card";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listSubscriptionPlans } from "@/lib/api/subscription";

interface SubscriptionPageProps {
  searchParams: Promise<{
    upgrade?: string;
  }>;
}

const SubscriptionPage = async ({ searchParams }: SubscriptionPageProps) => {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const plans = await listSubscriptionPlans();

  const params = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Subscription management</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Unternehmer need an active subscription to submit offers.
        </p>
      </div>

      {params.upgrade === "required" ? (
        <Card className="border-swiss-red bg-swiss-soft">
          <p className="text-sm font-semibold text-swiss-red">
            Offer submission is locked. Please activate a subscription first.
          </p>
        </Card>
      ) : null}

      <SubscriptionManagement user={user} plans={plans} />
    </div>
  );
};

export default SubscriptionPage;
