import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { logSecurityEvent } from "../_lib/admin.js";
import { stripe, getPlanByPriceId } from "../_lib/stripe.js";
import { updateUserByStripeCustomerId } from "../_lib/db.js";
import { supabaseAdmin } from "../_lib/supabase.js";

/**
 * Stripe webhook endpoint.
 *
 * Configure in Stripe Dashboard → Webhooks → Add endpoint:
 *   URL: https://your-domain.vercel.app/api/stripe/webhook
 *   Events:
 *     - checkout.session.completed
 *     - customer.subscription.updated
 *     - customer.subscription.deleted
 *     - invoice.payment_failed
 */

// Vercel requires raw body for signature verification.
// Export config to disable body parsing.
export const config = {
  api: {
    bodyParser: false,
  },
};

const SUBSCRIPTION_PRICE_SETTING_KEY = "subscription_price_config";

async function resolvePlanTypeByPriceId(priceId: string): Promise<"basic" | "pro" | null> {
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
    // Keep null when settings are unavailable.
  }
  const knownPlan = getPlanByPriceId(priceId);
  if (knownPlan?.type === "basic" || knownPlan?.type === "pro") return knownPlan.type;
  return null;
}

function resolvePlanTypeFromMetadata(
  value: unknown,
): "basic" | "pro" | null {
  return value === "basic" || value === "pro" ? value : null;
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Unknown error";
}

function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  // Stripe moved period boundaries to subscription items in newer API versions.
  return subscription.items.data[0]?.current_period_end ?? null;
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "active" | "canceled" | "past_due" | "none" {
  const statusMap: Partial<Record<Stripe.Subscription.Status, "active" | "canceled" | "past_due" | "none">> =
    {
      active: "active",
      trialing: "active",
      past_due: "past_due",
      unpaid: "past_due",
      canceled: "canceled",
      paused: "canceled",
      incomplete: "none",
      incomplete_expired: "none",
    };
  return statusMap[status] ?? "none";
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

async function syncCustomerSubscriptionState(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  const chosen = pickMostRelevantSubscription(subs.data);
  if (!chosen) {
    await updateUserByStripeCustomerId(customerId, {
      subscriptionStatus: "none",
      planType: null,
      subscriptionCurrentPeriodEnd: null,
    });
    return;
  }

  const mappedStatus = mapStripeStatus(chosen.status);
  const priceId = chosen.items.data[0]?.price?.id;
  const planFromPrice = priceId ? await resolvePlanTypeByPriceId(priceId) : null;
  const planFromMetadata = resolvePlanTypeFromMetadata(chosen.metadata?.planType);
  const planType = planFromPrice ?? planFromMetadata;
  const periodEndUnix = getSubscriptionPeriodEndUnix(chosen);

  const update: Parameters<typeof updateUserByStripeCustomerId>[1] = {
    subscriptionStatus: mappedStatus,
    planType: mappedStatus === "active" ? planType : null,
    subscriptionCurrentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
  };
  if (mappedStatus === "active") {
    update.offerCountThisMonth = 0;
  }

  await updateUserByStripeCustomerId(customerId, update);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error("Webhook signature verification failed:", message);
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      case "invoice.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: unknown) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription" || !session.customer || !session.subscription) {
    return;
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer.id;

  const subscription = await stripe.subscriptions.retrieve(
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id,
  );

  const priceId = subscription.items.data[0]?.price.id;
  const planFromPrice = priceId ? await resolvePlanTypeByPriceId(priceId) : null;
  const planFromSession = resolvePlanTypeFromMetadata(session.metadata?.planType);
  const planFromSubscription = resolvePlanTypeFromMetadata(subscription.metadata?.planType);
  const planType = planFromPrice ?? planFromSubscription ?? planFromSession;
  const periodEndUnix = getSubscriptionPeriodEndUnix(subscription as Stripe.Subscription);

  await updateUserByStripeCustomerId(customerId, {
    subscriptionStatus: "active",
    planType,
    subscriptionCurrentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
    offerCountThisMonth: 0,
  });

  console.log(`Checkout completed for customer ${customerId}, plan: ${planType}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  await syncCustomerSubscriptionState(customerId);

  console.log(
    `Subscription updated for customer ${customerId}`,
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  await syncCustomerSubscriptionState(customerId);

  console.log(`Subscription deleted for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
  await syncCustomerSubscriptionState(customerId);
  await logSecurityEvent({
    eventType: "stripe_invoice_payment_failed",
    details: {
      customerId,
      invoiceId: invoice.id ?? null,
      amountDue: invoice.amount_due ?? null,
      amountPaid: invoice.amount_paid ?? null,
      currency: invoice.currency ?? null,
    },
    severity: "warning",
  });

  console.log(`Payment failed for customer ${customerId}`);
}
