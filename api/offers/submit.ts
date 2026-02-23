import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../_lib/auth.js";
import { incrementOfferCount } from "../_lib/db.js";
import { PLANS } from "../_lib/stripe.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only contractors submit offers
    if (user.role !== "contractor") {
      return res.status(403).json({ error: "Only contractors can submit offers" });
    }

    // Enforce active subscription
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({
        error: "subscription_required",
        message: "An active subscription is required to submit offers.",
      });
    }

    if (!user.planType) {
      return res.status(403).json({
        error: "subscription_required",
        message: "No active plan found.",
      });
    }

    // Enforce offer limit for Basic plan
    const plan = PLANS[user.planType];
    if (plan.monthlyOfferLimit !== null && user.offerCountThisMonth >= plan.monthlyOfferLimit) {
      return res.status(403).json({
        error: "offer_limit_reached",
        message: `Offer limit of ${plan.monthlyOfferLimit} reached for this billing cycle.`,
        limit: plan.monthlyOfferLimit,
        used: user.offerCountThisMonth,
      });
    }

    // ---- All checks passed — process the offer ----

    const { projectId, content } = req.body as {
      projectId?: string;
      content?: string;
    };

    if (!projectId || !content) {
      return res.status(400).json({ error: "projectId and content are required" });
    }

    // Atomically increment offer count
    const newCount = await incrementOfferCount(user.id);

    // TODO: Save the offer to the database
    // await createOffer({ userId: user.id, projectId, content });

    return res.status(200).json({
      success: true,
      offerCountThisMonth: newCount,
      limit: plan.monthlyOfferLimit,
    });
  } catch (err: any) {
    console.error("Offer submission error:", err);
    return res.status(500).json({ error: "Failed to submit offer" });
  }
}
