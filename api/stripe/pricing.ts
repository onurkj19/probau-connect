import type { VercelRequest, VercelResponse } from "@vercel/node";

type Plan = "basic" | "pro";
type Cycle = "monthly" | "yearly";

const PRICE_IDS: Record<Plan, Record<Cycle, string>> = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC || "",
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
};

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

async function fetchPriceAmountFromStripe(priceId: string, secretKey: string): Promise<number | null> {
  const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Stripe price fetch failed (${response.status}) ${errorBody}`.trim());
  }

  const body = (await response.json()) as {
    unit_amount?: number | null;
    unit_amount_decimal?: string | null;
  };

  return toChfAmount({
    unit_amount: typeof body.unit_amount === "number" ? body.unit_amount : null,
    unit_amount_decimal:
      typeof body.unit_amount_decimal === "string" ? body.unit_amount_decimal : null,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const plans: Plan[] = ["basic", "pro"];
  const cycles: Cycle[] = ["monthly", "yearly"];

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    if (!secretKey) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    const result: Record<Plan, Record<Cycle, number | null>> = {
      basic: { monthly: null, yearly: null },
      pro: { monthly: null, yearly: null },
    };

    for (const plan of plans) {
      for (const cycle of cycles) {
        const priceId = PRICE_IDS[plan][cycle];
        if (!priceId) continue;
        try {
          result[plan][cycle] = await fetchPriceAmountFromStripe(priceId, secretKey);
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
