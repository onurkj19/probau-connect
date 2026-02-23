import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listSubscriptionPlans } from "@/lib/api/subscription";
import { formatCurrency } from "@/lib/utils";

const UnternehmerSubscriptionPage = async () => {
  const user = await getServerSessionUser();
  const plans = await listSubscriptionPlans();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Subscription</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage your current plan and upgrade access for additional opportunities.
        </p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">Current plan</p>
          <p className="text-xl font-bold text-brand-900">
            {user?.plan ? user.plan.toUpperCase() : "No active plan"}
          </p>
        </div>
        <StatusBadge status={user?.isSubscribed ? "subscribed" : "unsubscribed"} />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className={user?.plan === plan.id ? "border-brand-900" : undefined}>
            <h2 className="text-lg font-semibold text-brand-900">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold text-brand-900">{formatCurrency(plan.monthlyChf)}</p>
            <p className="text-sm text-neutral-500">per month</p>
            <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Button className="mt-5" variant={user?.plan === plan.id ? "secondary" : "primary"}>
              {user?.plan === plan.id ? "Current plan" : `Upgrade to ${plan.name}`}
            </Button>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">Billing integration</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Stripe Checkout integration placeholder. Next step: connect customer portal and invoice flow.
        </p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href="#">Open billing portal (placeholder)</Link>
        </Button>
      </Card>
    </div>
  );
};

export default UnternehmerSubscriptionPage;
