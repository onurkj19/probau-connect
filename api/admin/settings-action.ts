import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, logSecurityEvent, requireAdmin, safeJsonParse, sanitizeText } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type SettingAction = "upsert" | "delete";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;

  const { action, key, value } = (req.body ?? {}) as {
    action?: SettingAction;
    key?: string;
    value?: unknown;
  };
  const cleanKey = sanitizeText(key, 80).toLowerCase();
  const validKey = /^[a-z0-9._-]+$/.test(cleanKey);
  if (!action || !cleanKey || !validKey) return res.status(400).json({ error: "Missing action or key" });

  try {
    if (action === "upsert") {
      await supabaseAdmin.from("settings").upsert({
        key: cleanKey,
        value: safeJsonParse(value),
        updated_by: actor.id,
      });
    } else if (action === "delete") {
      await supabaseAdmin.from("settings").delete().eq("key", cleanKey);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_setting_${action}`,
      actorId: actor.id,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { key: cleanKey },
      severity: "critical",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin settings action error", error);
    return res.status(500).json({ error: "Failed to execute setting action" });
  }
}
