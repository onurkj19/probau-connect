import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "@/i18n/navigation";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { listSubscriptionPlans } from "@/lib/api/subscription";
import { formatCurrency } from "@/lib/utils";

const UnternehmerSubscriptionPage = async () => {
  const t = await getTranslations("dashboard.contractor");
  const tPricing = await getTranslations("pricing");
  const user = await getServerSessionUser();
  const plans = await listSubscriptionPlans();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">{t("subscriptionTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("subscriptionDescription")}</p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{t("currentPlanLabel")}</p>
          <p className="text-xl font-bold text-brand-900">
            {user?.plan ? user.plan.toUpperCase() : t("noActivePlan")}
          </p>
        </div>
        <StatusBadge status={user?.isSubscribed ? "subscribed" : "unsubscribed"} />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className={user?.plan === plan.id ? "border-brand-900" : undefined}>
            <h2 className="text-lg font-semibold text-brand-900">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold text-brand-900">{formatCurrency(plan.monthlyChf)}</p>
            <p className="text-sm text-neutral-500">{tPricing("perMonth")}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
              <li>• {tPricing(`plans.${plan.id}.feature1`)}</li>
              <li>• {tPricing(`plans.${plan.id}.feature2`)}</li>
              <li>• {tPricing(`plans.${plan.id}.feature3`)}</li>
            </ul>
            <Button className="mt-5" variant={user?.plan === plan.id ? "secondary" : "primary"}>
              {user?.plan === plan.id ? t("currentPlanButton") : t("upgradeTo", { plan: plan.name })}
            </Button>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-brand-900">{t("billingTitle")}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t("billingDescription")}</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href="#">{t("billingButton")}</Link>
        </Button>
      </Card>
    </div>
  );
};

export default UnternehmerSubscriptionPage;
