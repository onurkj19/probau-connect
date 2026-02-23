import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { stripe, getPlanByPriceId } from "../_lib/stripe";
import { updateUserByStripeCustomerId } from "../_lib/db";

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

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
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
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;

  await updateUserByStripeCustomerId(customerId, {
    subscriptionStatus: "active",
    planType: plan?.type || null,
    subscriptionCurrentPeriodEnd: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
    offerCountThisMonth: 0,
  });

  console.log(`Checkout completed for customer ${customerId}, plan: ${plan?.type}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;

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

  const update: Parameters<typeof updateUserByStripeCustomerId>[1] = {
    subscriptionStatus: mappedStatus,
    planType: mappedStatus === "active" ? (plan?.type || null) : null,
    subscriptionCurrentPeriodEnd: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
  };

  // Reset offer count when a new billing period starts (plan upgrade/renewal)
  if (mappedStatus === "active") {
    update.offerCountThisMonth = 0;
  }

  await updateUserByStripeCustomerId(customerId, update);

  console.log(
    `Subscription updated for customer ${customerId}: status=${mappedStatus}, plan=${plan?.type}`,
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
