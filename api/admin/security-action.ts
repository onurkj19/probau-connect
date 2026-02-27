import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type SecurityAction = "force_logout_all" | "force_logout_user" | "maintenance_mode";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;

  const { action, targetUserId, enabled, message } = (req.body ?? {}) as {
    action?: SecurityAction;
    targetUserId?: string;
    enabled?: boolean;
    message?: string;
  };

  if (!action) return res.status(400).json({ error: "Missing action" });

  try {
    if (action === "maintenance_mode") {
      await supabaseAdmin.from("settings").upsert({
        key: "maintenance_banner",
        value: { enabled: Boolean(enabled), message: message ?? "" },
        updated_by: actor.id,
      });
    } else if (action === "force_logout_all") {
      await supabaseAdmin.from("settings").upsert({
        key: "session_force_logout_at",
        value: { timestamp: new Date().toISOString() },
        updated_by: actor.id,
      });
    } else if (action === "force_logout_user") {
      if (!targetUserId) return res.status(400).json({ error: "Missing targetUserId" });
      await supabaseAdmin.from("profiles").update({ is_banned: true }).eq("id", targetUserId);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_security_${action}`,
      actorId: actor.id,
      targetUserId: targetUserId ?? null,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { enabled: enabled ?? null, message: message ?? null },
      severity: "critical",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin security action error", error);
    return res.status(500).json({ error: "Failed to execute security action" });
  }
}
