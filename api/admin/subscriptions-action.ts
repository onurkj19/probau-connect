import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";
import { getPlanByPriceId, stripe } from "../_lib/stripe.js";

type SubAction = "force_sync" | "extend" | "revoke";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;

  const { action, userId, stripeCustomerId, extraDays } = (req.body ?? {}) as {
    action?: SubAction;
    userId?: string;
    stripeCustomerId?: string;
    extraDays?: number;
  };

  if (!action || !userId || !isUuid(userId)) {
    return res.status(400).json({ error: "Missing action or userId" });
  }

  try {
    if (action === "force_sync") {
      if (!stripeCustomerId) return res.status(400).json({ error: "Missing stripeCustomerId" });

      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        limit: 5,
        status: "all",
      });
      const activeSub = subscriptions.data.find((sub) => ["active", "trialing", "past_due"].includes(sub.status));

      if (!activeSub) {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "none",
            plan_type: null,
            subscription_current_period_end: null,
          })
          .eq("id", userId);
      } else {
        const firstItem = activeSub.items.data[0];
        const maybePriceId = firstItem?.price?.id;
        const mappedPlan = maybePriceId ? getPlanByPriceId(maybePriceId) : undefined;
        const maybeCurrentPeriodEnd = (
          activeSub as unknown as { current_period_end?: number }
        ).current_period_end;
        const periodEndIso = typeof maybeCurrentPeriodEnd === "number"
          ? new Date(maybeCurrentPeriodEnd * 1000).toISOString()
          : null;

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: activeSub.status === "trialing" ? "active" : (activeSub.status as "active" | "past_due" | "canceled"),
            plan_type: mappedPlan?.type ?? null,
            subscription_current_period_end: periodEndIso,
          })
          .eq("id", userId);
      }
    } else if (action === "extend") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("subscription_current_period_end, subscription_status")
        .eq("id", userId)
        .single();

      const base = profile?.subscription_current_period_end
        ? new Date(profile.subscription_current_period_end)
        : new Date();
      const next = new Date(base);
      next.setDate(next.getDate() + Math.max(1, Number(extraDays) || 30));

      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: profile?.subscription_status === "none" ? "active" : profile?.subscription_status,
          subscription_current_period_end: next.toISOString(),
        })
        .eq("id", userId);
    } else if (action === "revoke") {
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "canceled",
          plan_type: null,
          subscription_current_period_end: null,
        })
        .eq("id", userId);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_subscription_${action}`,
      actorId: actor.id,
      targetUserId: userId,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { extraDays: extraDays ?? null },
      severity: "warning",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin subscriptions action error", error);
    return res.status(500).json({ error: "Failed to execute subscription action" });
  }
}
