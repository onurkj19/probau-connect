import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const PricingPreviewSection = () => (
  <section className="border-b border-neutral-200 bg-neutral-50">
    <div className="container py-16 lg:py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-900">Transparent pricing</h2>
          <p className="mt-3 max-w-xl text-neutral-600">
            Arbeitsgeber use the platform free. Unternehmer subscribe monthly to submit offers.
          </p>
        </div>
        <Link href="/pricing">
          <Button variant="secondary">View all pricing details</Button>
        </Link>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Card className="border-brand-900">
          <p className="text-sm font-semibold text-brand-900">Arbeitsgeber</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">CHF 0</p>
          <p className="mt-1 text-sm text-neutral-600">Post projects and review offers.</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-900">Unternehmer Basic</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">CHF 79</p>
          <p className="mt-1 text-sm text-neutral-600">For focused regional contractors.</p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand-900">Unternehmer Pro</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">CHF 149</p>
          <p className="mt-1 text-sm text-neutral-600">For multi-canton growth teams.</p>
        </Card>
      </div>
    </div>
  </section>
);
