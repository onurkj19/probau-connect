import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
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
  const knownPlan = getPlanByPriceId(priceId);
  if (knownPlan?.type === "basic" || knownPlan?.type === "pro") return knownPlan.type;
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
    if (
      priceId === value?.basic?.monthlyPriceId ||
      priceId === value?.basic?.yearlyPriceId
    ) {
      return "basic";
    }
    if (priceId === value?.pro?.monthlyPriceId || priceId === value?.pro?.yearlyPriceId) {
      return "pro";
    }
  } catch {
    // Keep null when settings are unavailable.
  }
  return null;
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getSubscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  // Stripe moved period boundaries to subscription items in newer API versions.
  return subscription.items.data[0]?.current_period_end ?? null;
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
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
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
  } catch (err: any) {
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
  const planType = priceId ? await resolvePlanTypeByPriceId(priceId) : null;
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

  const priceId = subscription.items.data[0]?.price.id;
  const planType = priceId ? await resolvePlanTypeByPriceId(priceId) : null;

  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "none",
    incomplete_expired: "none",
    trialing: "active",
    paused: "canceled",
  };

  const mappedStatus = (statusMap[subscription.status] || "none") as
    "active" | "canceled" | "past_due" | "none";
  const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);

  const update: Parameters<typeof updateUserByStripeCustomerId>[1] = {
    subscriptionStatus: mappedStatus,
    planType: mappedStatus === "active" ? planType : null,
    subscriptionCurrentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
  };

  // Reset offer count when a new billing period starts (plan upgrade/renewal)
  if (mappedStatus === "active") {
    update.offerCountThisMonth = 0;
  }

  await updateUserByStripeCustomerId(customerId, update);

  console.log(
    `Subscription updated for customer ${customerId}: status=${mappedStatus}, plan=${planType}`,
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  await updateUserByStripeCustomerId(customerId, {
    subscriptionStatus: "canceled",
    planType: null,
    subscriptionCurrentPeriodEnd: null,
  });

  console.log(`Subscription deleted for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;

  await updateUserByStripeCustomerId(customerId, {
    subscriptionStatus: "past_due",
  });

  console.log(`Payment failed for customer ${customerId}`);
}
