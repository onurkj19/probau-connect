import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { stripe } from "../_lib/stripe.js";
import { authenticateRequest } from "../_lib/auth.js";
import { updateUserSubscription } from "../_lib/db.js";
import { supabaseAdmin } from "../_lib/supabase.js";

const SUBSCRIPTION_PRICE_SETTING_KEY = "subscription_price_config";

type PlanType = "basic" | "pro";
type BillingCycle = "monthly" | "yearly" | null;

function resolvePlanTypeFromMetadata(value: unknown): PlanType | null {
  return value === "basic" || value === "pro" ? value : null;
}

async function resolvePlanTypeByPriceId(priceId: string): Promise<PlanType | null> {
  const getProductId = async (id: string): Promise<string | null> => {
    if (!id) return null;
    try {
      const price = await stripe.prices.retrieve(id);
      return typeof price.product === "string" ? price.product : price.product?.id ?? null;
    } catch {
      return null;
    }
  };

  try {
    const { data: row } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", SUBSCRIPTION_PRICE_SETTING_KEY)
      .maybeSingle();
    const value = (row?.value as {
      basic?: { monthlyPriceId?: string | null; yearlyPriceId?: string | null };
      pro?: { monthlyPriceId?: string | null; yearlyPriceId?: string | null };
    } | null) ?? null;

    const basicMonthlyId = value?.basic?.monthlyPriceId ?? "";
    const basicYearlyId = value?.basic?.yearlyPriceId ?? "";
    const proMonthlyId = value?.pro?.monthlyPriceId ?? "";
    const proYearlyId = value?.pro?.yearlyPriceId ?? "";

    if (priceId === basicMonthlyId || priceId === basicYearlyId) {
      return "basic";
    }
    if (priceId === proMonthlyId || priceId === proYearlyId) {
      return "pro";
    }

    // If price IDs changed in Stripe, match by product lineage.
    const [targetProductId, basicMonthlyProductId, basicYearlyProductId, proMonthlyProductId, proYearlyProductId] =
      await Promise.all([
        getProductId(priceId),
        getProductId(basicMonthlyId),
        getProductId(basicYearlyId),
        getProductId(proMonthlyId),
        getProductId(proYearlyId),
      ]);
    const basicProducts = new Set([basicMonthlyProductId, basicYearlyProductId].filter(Boolean));
    const proProducts = new Set([proMonthlyProductId, proYearlyProductId].filter(Boolean));
    if (targetProductId && basicProducts.has(targetProductId)) return "basic";
    if (targetProductId && proProducts.has(targetProductId)) return "pro";
  } catch {
    // Ignore settings read failures and fallback to null.
  }
  // Fallback for legacy env-configured prices.
  const priceMap = {
    basic: {
      monthly: process.env.STRIPE_PRICE_BASIC || "",
      yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || "",
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO || "",
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    },
  };
  if (priceId === priceMap.basic.monthly || priceId === priceMap.basic.yearly) return "basic";
  if (priceId === priceMap.pro.monthly || priceId === priceMap.pro.yearly) return "pro";
  return null;
}

function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  const direct = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  if (typeof direct === "number") return direct;
  return subscription.items.data[0]?.current_period_end ?? null;
}

function getBillingCycleFromSubscription(subscription: Stripe.Subscription): BillingCycle {
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  if (interval === "month") return "monthly";
  if (interval === "year") return "yearly";
  return null;
}

function getPriceChfFromSubscription(subscription: Stripe.Subscription): number | null {
  const price = subscription.items.data[0]?.price;
  if (!price) return null;
  if (typeof price.unit_amount === "number") return Number((price.unit_amount / 100).toFixed(2));
  if (typeof price.unit_amount_decimal === "string") {
    const parsed = Number(price.unit_amount_decimal);
    if (Number.isFinite(parsed)) return Number((parsed / 100).toFixed(2));
  }
  return null;
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "canceled" | "past_due" | "none" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled" || status === "paused") return "canceled";
  return "none";
}

function pickMostRelevantSubscription(
  subscriptions: Stripe.Subscription[],
): Stripe.Subscription | null {
  if (!subscriptions.length) return null;
  const rank: Record<"active" | "past_due" | "canceled" | "none", number> = {
    active: 4,
    past_due: 3,
    canceled: 2,
    none: 1,
  };
  return [...subscriptions].sort((a, b) => {
    const statusDiff = rank[mapStripeStatus(b.status)] - rank[mapStripeStatus(a.status)];
    if (statusDiff !== 0) return statusDiff;
    return (b.created ?? 0) - (a.created ?? 0);
  })[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.role !== "contractor") {
      return res.status(403).json({ error: "Only contractors can sync subscriptions" });
    }
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const list = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 100,
    });
    const selected = pickMostRelevantSubscription(list.data);

    if (!selected) {
      await updateUserSubscription(user.id, {
        subscriptionStatus: "none",
        planType: null,
        subscriptionCurrentPeriodEnd: null,
      });
      return res.status(200).json({
        success: true,
        status: "none",
        planType: null,
        billingCycle: null,
        priceChf: null,
        renewalDate: null,
      });
    }

    const mappedStatus = mapStripeStatus(selected.status);
    const priceId = selected.items.data[0]?.price?.id ?? "";
    const planFromPrice = priceId ? await resolvePlanTypeByPriceId(priceId) : null;
    const planFromMetadata = resolvePlanTypeFromMetadata(selected.metadata?.planType);
    const planType = planFromPrice ?? planFromMetadata;
    const periodEndUnix = getSubscriptionPeriodEndUnix(selected);
    const billingCycle = getBillingCycleFromSubscription(selected);
    const priceChf = getPriceChfFromSubscription(selected);
    const renewalDate = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;

    await updateUserSubscription(user.id, {
      subscriptionStatus: mappedStatus,
      planType: mappedStatus === "active" ? planType : null,
      subscriptionCurrentPeriodEnd: renewalDate,
      offerCountThisMonth: mappedStatus === "active" ? 0 : user.offerCountThisMonth,
    });

    return res.status(200).json({
      success: true,
      status: mappedStatus,
      planType,
      billingCycle,
      priceChf,
      renewalDate,
    });
  } catch (error) {
    console.error("Sync subscription state error", error);
    return res.status(500).json({ error: "Failed to sync subscription state" });
  }
}
