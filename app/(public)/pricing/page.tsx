import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listSubscriptionPlans } from "@/lib/api/subscription";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Clear ProBau.ch pricing for Arbeitsgeber and Unternehmer.",
};

const PricingPage = async () => {
  const plans = await listSubscriptionPlans();

  return (
    <section className="bg-neutral-50 py-16">
      <div className="container">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-brand-900">Pricing</h1>
          <p className="mt-4 text-neutral-600">
            Arbeitsgeber can publish projects for free. Unternehmer subscribe to submit offers.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Card className="border-brand-900">
            <h2 className="text-lg font-semibold text-brand-900">Arbeitsgeber</h2>
            <p className="mt-3 text-3xl font-bold text-brand-900">{formatCurrency(0)}</p>
            <p className="mt-1 text-sm text-neutral-500">Per month</p>
            <ul className="mt-5 space-y-2 text-sm text-neutral-600">
              <li>Unlimited project postings</li>
              <li>Review all received offers</li>
              <li>Project history and tracking</li>
            </ul>
          </Card>

          {plans.map((plan) => (
            <Card key={plan.id}>
              <h2 className="text-lg font-semibold text-brand-900">{plan.name}</h2>
              <p className="mt-3 text-3xl font-bold text-brand-900">{formatCurrency(plan.monthlyChf)}</p>
              <p className="mt-1 text-sm text-neutral-500">Per month</p>
              <p className="mt-2 text-sm text-neutral-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-neutral-600">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/register">
            <Button size="lg">Create account</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PricingPage;
