import { supabase } from "@/lib/supabase";

export const BASE_PLAN_PRICES = {
  basic: 79,
  pro: 149,
} as const;

export const YEARLY_PLAN_PRICES = {
  basic: BASE_PLAN_PRICES.basic * 12,
  pro: BASE_PLAN_PRICES.pro * 12,
} as const;

export type BillingCycle = "monthly" | "yearly";
export type PlanType = "basic" | "pro";

export interface StripePlanPrices {
  basic: {
    monthly: number | null;
    yearly: number | null;
  };
  pro: {
    monthly: number | null;
    yearly: number | null;
  };
}

export interface SubscriptionPricingConfig {
  monthly: {
    enabled: boolean;
    percentOff: number;
    description: string;
    validUntil: string | null;
  };
  yearly: {
    enabled: boolean;
    freeMonths: number;
    description: string;
    validUntil: string | null;
  };
}

const EMPTY_CONFIG: SubscriptionPricingConfig = {
  monthly: {
    enabled: false,
    percentOff: 0,
    description: "",
    validUntil: null,
  },
  yearly: {
    enabled: false,
    freeMonths: 0,
    description: "",
    validUntil: null,
  },
};

function isOfferValid(validUntil: string | null): boolean {
  if (!validUntil) return true;
  const ts = new Date(validUntil).getTime();
  return Number.isFinite(ts) && ts > Date.now();
}

const FALLBACK_STRIPE_PRICES: StripePlanPrices = {
  basic: { monthly: BASE_PLAN_PRICES.basic, yearly: YEARLY_PLAN_PRICES.basic },
  pro: { monthly: BASE_PLAN_PRICES.pro, yearly: YEARLY_PLAN_PRICES.pro },
};

export async function fetchStripePlanPrices(): Promise<StripePlanPrices> {
  try {
    const response = await fetch("/api/stripe/pricing");
    if (!response.ok) return FALLBACK_STRIPE_PRICES;
    const body = (await response.json()) as {
      prices?: Partial<Record<PlanType, Partial<Record<BillingCycle, number | null>>>>;
    };

    const prices = body?.prices;
    if (!prices) return FALLBACK_STRIPE_PRICES;

    return {
      basic: {
        monthly:
          typeof prices.basic?.monthly === "number"
            ? prices.basic.monthly
            : FALLBACK_STRIPE_PRICES.basic.monthly,
        yearly:
          typeof prices.basic?.yearly === "number"
            ? prices.basic.yearly
            : FALLBACK_STRIPE_PRICES.basic.yearly,
      },
      pro: {
        monthly:
          typeof prices.pro?.monthly === "number"
            ? prices.pro.monthly
            : FALLBACK_STRIPE_PRICES.pro.monthly,
        yearly:
          typeof prices.pro?.yearly === "number"
            ? prices.pro.yearly
            : FALLBACK_STRIPE_PRICES.pro.yearly,
      },
    };
  } catch {
    return FALLBACK_STRIPE_PRICES;
  }
}

export function getPlanPrice(
  plan: PlanType,
  cycle: BillingCycle,
  stripePrices?: StripePlanPrices | null,
): number {
  const priceFromStripe = stripePrices?.[plan]?.[cycle];
  if (typeof priceFromStripe === "number" && priceFromStripe > 0) return priceFromStripe;
  return cycle === "yearly" ? YEARLY_PLAN_PRICES[plan] : BASE_PLAN_PRICES[plan];
}

export function getYearlySavingsPercent(
  plan: PlanType,
  yearlyPrice: number,
  stripePrices?: StripePlanPrices | null,
): number {
  const monthlyPrice = getPlanPrice(plan, "monthly", stripePrices);
  const annualMonthlyTotal = monthlyPrice * 12;
  if (!Number.isFinite(annualMonthlyTotal) || annualMonthlyTotal <= 0) return 0;
  const ratio = 1 - yearlyPrice / annualMonthlyTotal;
  if (ratio <= 0) return 0;
  return Math.round(ratio * 100);
}

export async function fetchSubscriptionPricingConfig(): Promise<SubscriptionPricingConfig> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "subscription_discount_config")
    .maybeSingle();
  if (error || !data?.value) return EMPTY_CONFIG;
  const value = data.value as {
    enabled?: boolean;
    percentOff?: unknown;
    description?: unknown;
    validUntil?: unknown;
    yearlyOffer?: {
      enabled?: boolean;
      freeMonths?: unknown;
      description?: unknown;
      validUntil?: unknown;
    } | null;
  };
  const monthlyPercent = Number(value.percentOff ?? 0);
  const yearlyFreeMonths = Number(value.yearlyOffer?.freeMonths ?? 0);
  return {
    monthly: {
      enabled: Boolean(value.enabled),
      percentOff:
        Number.isFinite(monthlyPercent) && monthlyPercent > 0
          ? Math.min(100, monthlyPercent)
          : 0,
      description:
        typeof value.description === "string" ? value.description.trim() : "",
      validUntil:
        typeof value.validUntil === "string" ? value.validUntil : null,
    },
    yearly: {
      enabled: Boolean(value.yearlyOffer?.enabled),
      freeMonths:
        Number.isFinite(yearlyFreeMonths) && yearlyFreeMonths > 0
          ? Math.min(11, Math.floor(yearlyFreeMonths))
          : 0,
      description:
        typeof value.yearlyOffer?.description === "string"
          ? value.yearlyOffer.description.trim()
          : "",
      validUntil:
        typeof value.yearlyOffer?.validUntil === "string"
          ? value.yearlyOffer.validUntil
          : null,
    },
  };
}

export async function fetchDefaultSubscriptionDiscountPercent(
  cycle: BillingCycle = "monthly",
): Promise<number> {
  const config = await fetchSubscriptionPricingConfig();
  if (cycle === "yearly") {
    if (!config.yearly.enabled || !isOfferValid(config.yearly.validUntil)) return 0;
    const percent = (config.yearly.freeMonths / 12) * 100;
    return Number(percent.toFixed(2));
  }
  if (!config.monthly.enabled || !isOfferValid(config.monthly.validUntil)) return 0;
  return config.monthly.percentOff;
}

export function getOfferDescription(
  config: SubscriptionPricingConfig,
  cycle: BillingCycle,
): string {
  if (cycle === "yearly") return config.yearly.description;
  return config.monthly.description;
}

export function getOfferValidUntil(
  config: SubscriptionPricingConfig,
  cycle: BillingCycle,
): string | null {
  if (cycle === "yearly") return config.yearly.validUntil;
  return config.monthly.validUntil;
}

export function applyPercentDiscount(basePrice: number, percent: number): number {
  const discounted = basePrice * (1 - percent / 100);
  return Number(discounted.toFixed(2));
}

export function formatChf(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
