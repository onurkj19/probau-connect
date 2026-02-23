import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripe, PLANS, type PlanType } from "../_lib/stripe.js";
import { authenticateRequest } from "../_lib/auth.js";
import { updateUserSubscription } from "../_lib/db.js";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message || "Unknown error");
  }
  return "Unknown error";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.role !== "contractor") {
      return res.status(403).json({ error: "Only contractors can subscribe" });
    }

    const { planType } = req.body as { planType?: PlanType };

    if (!planType || !PLANS[planType]) {
      return res.status(400).json({ error: "Invalid plan type. Use 'basic' or 'pro'." });
    }

    const plan = PLANS[planType];

    if (!plan.priceId) {
      return res.status(500).json({ error: "Stripe Price ID not configured for this plan" });
    }

    // Reuse existing Stripe customer or create new one
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          role: user.role,
        },
      });
      customerId = customer.id;

      await updateUserSubscription(user.id, {
        stripeCustomerId: customerId,
      });
    }

    const appUrl = process.env.VITE_APP_URL || "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/de/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/de/dashboard/subscription`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planType: plan.type,
        },
      },
      metadata: {
        userId: user.id,
        planType: plan.type,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const details = getErrorMessage(err);
    console.error("Checkout session error:", details, err);
    return res.status(500).json({
      error: "Failed to create checkout session",
      details,
    });
  }
}
