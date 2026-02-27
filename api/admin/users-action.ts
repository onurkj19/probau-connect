import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type UserAction =
  | "ban"
  | "unban"
  | "verify"
  | "unverify"
  | "change_role"
  | "set_subscription"
  | "soft_delete"
  | "impersonate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res);
  if (!actor) return;

  const {
    action,
    userId,
    userIds,
    role,
    planType,
    subscriptionStatus,
  } = (req.body ?? {}) as {
    action?: UserAction;
    userId?: string;
    userIds?: string[];
    role?: "super_admin" | "admin" | "moderator" | "project_owner" | "contractor";
    planType?: "basic" | "pro" | null;
    subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
  };

  const targetIds = Array.isArray(userIds) && userIds.length > 0 ? userIds : (userId ? [userId] : []);
  const validTargetIds = targetIds.filter(isUuid);
  if (!action || validTargetIds.length === 0) {
    return res.status(400).json({ error: "Missing action or valid user targets" });
  }

  const ipAddress = getRequestIp(req);
  const userAgent = String(req.headers["user-agent"] ?? "");

  try {
    if (action === "change_role" && actor.role === "moderator") {
      return res.status(403).json({ error: "Moderators cannot change roles" });
    }
    if (action === "set_subscription" && actor.role === "moderator") {
      return res.status(403).json({ error: "Moderators cannot change subscriptions" });
    }

    switch (action) {
      case "ban":
        await supabaseAdmin
          .from("profiles")
          .update({ is_banned: true })
          .in("id", validTargetIds);
        break;
      case "unban":
        await supabaseAdmin
          .from("profiles")
          .update({ is_banned: false })
          .in("id", validTargetIds);
        break;
      case "verify":
        await supabaseAdmin
          .from("profiles")
          .update({ is_verified: true })
          .in("id", validTargetIds);
        break;
      case "unverify":
        await supabaseAdmin
          .from("profiles")
          .update({ is_verified: false })
          .in("id", validTargetIds);
        break;
      case "change_role":
        if (!role) return res.status(400).json({ error: "Missing role" });
        await supabaseAdmin
          .from("profiles")
          .update({ role })
          .in("id", validTargetIds);
        break;
      case "set_subscription":
        await supabaseAdmin
          .from("profiles")
          .update({
            plan_type: planType ?? null,
            subscription_status: subscriptionStatus ?? "none",
          })
          .in("id", validTargetIds);
        break;
      case "soft_delete":
        await supabaseAdmin
          .from("profiles")
          .update({
            deleted_at: new Date().toISOString(),
            is_banned: true,
          })
          .in("id", validTargetIds);
        break;
      case "impersonate": {
        if (validTargetIds.length !== 1) {
          return res.status(400).json({ error: "Impersonation requires a single user target" });
        }
        const impersonationUserId = validTargetIds[0];
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await logSecurityEvent({
          eventType: "admin_impersonation_issued",
          actorId: actor.id,
          targetUserId: impersonationUserId,
          ipAddress,
          userAgent,
          severity: "warning",
          details: { token, expiresAt },
        });
        return res.status(200).json({ success: true, token, expiresAt, targetUserId: impersonationUserId });
      }
      default:
        return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_user_${action}`,
      actorId: actor.id,
      targetUserId: validTargetIds[0] ?? null,
      ipAddress,
      userAgent,
      details: { role, planType, subscriptionStatus, targetCount: validTargetIds.length, targetIds: validTargetIds },
      severity: "warning",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin users action error", error);
    return res.status(500).json({ error: "Failed to execute user action" });
  }
}
