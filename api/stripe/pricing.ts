import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripe, getPlanPriceId } from "../_lib/stripe.js";

type Plan = "basic" | "pro";
type Cycle = "monthly" | "yearly";

function toChfAmount(price: { unit_amount: number | null; unit_amount_decimal: string | null }): number | null {
  if (typeof price.unit_amount === "number") {
    return Number((price.unit_amount / 100).toFixed(2));
  }
  if (price.unit_amount_decimal) {
    const parsed = Number(price.unit_amount_decimal);
    if (Number.isFinite(parsed)) return Number((parsed / 100).toFixed(2));
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const plans: Plan[] = ["basic", "pro"];
  const cycles: Cycle[] = ["monthly", "yearly"];

  try {
    const result: Record<Plan, Record<Cycle, number | null>> = {
      basic: { monthly: null, yearly: null },
      pro: { monthly: null, yearly: null },
    };

    for (const plan of plans) {
      for (const cycle of cycles) {
        const priceId = getPlanPriceId(plan, cycle);
        if (!priceId) continue;
        try {
          const stripePrice = await stripe.prices.retrieve(priceId);
          result[plan][cycle] = toChfAmount({
            unit_amount: stripePrice.unit_amount,
            unit_amount_decimal: stripePrice.unit_amount_decimal ?? null,
          });
        } catch (error) {
          console.error(`Failed to load Stripe price for ${plan}/${cycle} (${priceId})`, error);
          result[plan][cycle] = null;
        }
      }
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json({ prices: result });
  } catch (error) {
    console.error("Failed to load Stripe prices", error);
    return res.status(500).json({ error: "Failed to load Stripe prices" });
  }
}
