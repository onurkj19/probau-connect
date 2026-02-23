import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { listSubscriptionPlans } from "@/lib/api/subscription";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {};

const PricingPage = async () => {
  const t = await getTranslations("pricing");
  const plans = await listSubscriptionPlans();

  return (
    <section className="bg-neutral-50 py-16">
      <div className="container">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-brand-900">{t("title")}</h1>
          <p className="mt-4 text-neutral-600">{t("description")}</p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Card className="border-brand-900">
            <h2 className="text-lg font-semibold text-brand-900">{t("employerTitle")}</h2>
            <p className="mt-3 text-3xl font-bold text-brand-900">{formatCurrency(0)}</p>
            <p className="mt-1 text-sm text-neutral-500">{t("perMonth")}</p>
            <ul className="mt-5 space-y-2 text-sm text-neutral-600">
              <li>{t("employerFeature1")}</li>
              <li>{t("employerFeature2")}</li>
              <li>{t("employerFeature3")}</li>
            </ul>
          </Card>

          {plans.map((plan) => (
            <Card key={plan.id}>
              <h2 className="text-lg font-semibold text-brand-900">{plan.name}</h2>
              <p className="mt-3 text-3xl font-bold text-brand-900">{formatCurrency(plan.monthlyChf)}</p>
              <p className="mt-1 text-sm text-neutral-500">{t("perMonth")}</p>
              <p className="mt-2 text-sm text-neutral-600">{t(`plans.${plan.id}.description`)}</p>
              <ul className="mt-5 space-y-2 text-sm text-neutral-600">
                <li>• {t(`plans.${plan.id}.feature1`)}</li>
                <li>• {t(`plans.${plan.id}.feature2`)}</li>
                <li>• {t(`plans.${plan.id}.feature3`)}</li>
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/register">
            <Button size="lg">{t("createAccount")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingPage;
