import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export type PlanType = "basic" | "pro";

export interface PlanConfig {
  type: PlanType;
  priceId: string;
  monthlyOfferLimit: number | null; // null = unlimited
  priceChf: number;
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
    priceId: process.env.STRIPE_PRICE_BASIC || "",
    monthlyOfferLimit: 10,
    priceChf: 79,
  },
  pro: {
    type: "pro",
    priceId: process.env.STRIPE_PRICE_PRO || "",
    monthlyOfferLimit: null,
    priceChf: 149,
  },
};

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find((p) => p.priceId === priceId);
}
