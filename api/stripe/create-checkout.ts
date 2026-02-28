import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { stripe, PLANS, type PlanType } from "../_lib/stripe.js";
import { authenticateRequest } from "../_lib/auth.js";
import { updateUserSubscription } from "../_lib/db.js";
import { supabaseAdmin } from "../_lib/supabase.js";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message || "Unknown error");
  }
  return "Unknown error";
}

function sanitizePublicError(message: string): string {
  if (message.includes("Invalid API Key")) {
    return "Stripe configuration error: invalid STRIPE_SECRET_KEY.";
  }
  return message;
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

    const { planType, promoCode } = req.body as { planType?: PlanType; promoCode?: string };

    if (!planType || !PLANS[planType]) {
      return res.status(400).json({ error: "Invalid plan type. Use 'basic' or 'pro'." });
    }

    const plan = PLANS[planType];

    if (!plan.priceId) {
      return res.status(500).json({ error: "Stripe Price ID not configured for this plan" });
    }

    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    const normalizedPromoCode = typeof promoCode === "string" ? promoCode.trim().toUpperCase() : "";
    if (normalizedPromoCode) {
      if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedPromoCode)) {
        return res.status(400).json({ error: "Invalid promo code format" });
      }
      const promoCodes = await stripe.promotionCodes.list({ active: true, limit: 100 });
      const promo = promoCodes.data.find((item) => (item.code ?? "").toUpperCase() === normalizedPromoCode);
      if (!promo) return res.status(400).json({ error: "Promo code is invalid or inactive" });
      discounts.push({ promotion_code: promo.id });
    } else {
      const { data: discountConfigRow } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "subscription_discount_config")
        .maybeSingle();
      const discountConfig = (discountConfigRow?.value as { enabled?: boolean; couponId?: string | null } | null) ?? null;
      if (discountConfig?.enabled && typeof discountConfig.couponId === "string" && discountConfig.couponId) {
        discounts.push({ coupon: discountConfig.couponId });
      }
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
        promoCode: normalizedPromoCode || "",
      },
      ...(discounts.length > 0 ? { discounts } : {}),
    });

    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const rawDetails = getErrorMessage(err);
    const details = sanitizePublicError(rawDetails);
    console.error("Checkout session error:", rawDetails, err);
    return res.status(500).json({
      error: "Failed to create checkout session",
      details,
    });
  }
}
