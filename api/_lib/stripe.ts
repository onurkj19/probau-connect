import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export type PlanType = "basic" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface PlanConfig {
  type: PlanType;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyOfferLimit: number | null; // null = unlimited
  monthlyPriceChf: number;
}

/**
 * Map your Stripe Price IDs here after creating products in the Stripe Dashboard.
 *
 * Steps:
 * 1. Create a "Basic" product in Stripe → recurring CHF 79/month → copy price ID
 * 2. Create a "Pro" product in Stripe → recurring CHF 149/month → copy price ID
 * 3. Set STRIPE_PRICE_BASIC and STRIPE_PRICE_PRO in environment variables
 */
export const PLANS: Record<PlanType, PlanConfig> = {
  basic: {
    type: "basic",
    monthlyPriceId: process.env.STRIPE_PRICE_BASIC || "",
    yearlyPriceId: process.env.STRIPE_PRICE_BASIC_YEARLY || "",
    monthlyOfferLimit: 10,
    monthlyPriceChf: 79,
  },
  pro: {
    type: "pro",
    monthlyPriceId: process.env.STRIPE_PRICE_PRO || "",
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    monthlyOfferLimit: null,
    monthlyPriceChf: 149,
  },
};

export function getPlanPriceId(planType: PlanType, cycle: BillingCycle): string {
  const plan = PLANS[planType];
  return cycle === "yearly" ? plan.yearlyPriceId : plan.monthlyPriceId;
}

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find(
    (p) => p.monthlyPriceId === priceId || p.yearlyPriceId === priceId,
  );
}
