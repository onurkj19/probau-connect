import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type OfferAction = "accept" | "reject" | "delete";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  const { action, offerId, offerIds } = (req.body ?? {}) as {
    action?: OfferAction;
    offerId?: string;
    offerIds?: string[];
  };
  const targets = Array.isArray(offerIds) && offerIds.length > 0 ? offerIds : (offerId ? [offerId] : []);
  const validTargets = targets.filter(isUuid);
  if (!action || validTargets.length === 0) return res.status(400).json({ error: "Missing action or offer targets" });

  try {
    if (action === "accept") {
      await supabaseAdmin.from("offers").update({ status: "accepted" }).in("id", validTargets);
    } else if (action === "reject") {
      await supabaseAdmin.from("offers").update({ status: "rejected" }).in("id", validTargets);
    } else if (action === "delete") {
      await supabaseAdmin.from("offers").delete().in("id", validTargets);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_offer_${action}`,
      actorId: actor.id,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { targetCount: validTargets.length, offerIds: validTargets },
      severity: "warning",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin offers action error", error);
    return res.status(500).json({ error: "Failed to execute offer action" });
  }
}
