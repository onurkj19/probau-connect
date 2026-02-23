import Link from "next/link";

import { Section } from "@/components/common/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const PricingPreviewSection = () => (
  <Section
    className="bg-neutral-50"
    eyebrow="Pricing preview"
    title="Simple plans for Unternehmer"
    description="Arbeitsgeber post projects free of charge. Contractors subscribe to submit offers."
  >
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <p className="text-sm font-semibold text-brand-900">Basic</p>
        <p className="mt-3 text-4xl font-bold text-brand-900">CHF 79</p>
        <p className="text-sm text-neutral-500">per month</p>
        <ul className="mt-5 space-y-2 text-sm text-neutral-600">
          <li>Access active projects</li>
          <li>Submit offers with attachments</li>
          <li>Standard support</li>
        </ul>
      </Card>

      <Card className="border-brand-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-900">Pro</p>
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">
            Most chosen
          </span>
        </div>
        <p className="mt-3 text-4xl font-bold text-brand-900">CHF 149</p>
        <p className="text-sm text-neutral-500">per month</p>
        <ul className="mt-5 space-y-2 text-sm text-neutral-600">
          <li>Everything in Basic</li>
          <li>Unlimited offers</li>
          <li>Priority matching and support</li>
        </ul>
      </Card>
    </div>

    <div className="mt-8">
      <Button asChild variant="secondary" size="lg">
        <Link href="/pricing">View Full Pricing</Link>
      </Button>
    </div>
  </Section>
);
