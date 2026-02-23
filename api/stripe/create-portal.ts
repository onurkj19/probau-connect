import type { VercelRequest, VercelResponse } from "@vercel/node";
import { stripe } from "../_lib/stripe.js";
import { authenticateRequest } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const appUrl = process.env.VITE_APP_URL || "http://localhost:8080";

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/de/dashboard/subscription`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Portal session error:", err);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
}
