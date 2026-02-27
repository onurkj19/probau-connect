import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin, sanitizeText } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type FlagAction = "toggle" | "update" | "create" | "delete";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;

  const { action, id, name, enabled, description } = (req.body ?? {}) as {
    action?: FlagAction;
    id?: string;
    name?: string;
    enabled?: boolean;
    description?: string | null;
  };
  if (!action) return res.status(400).json({ error: "Missing action" });
  const cleanName = sanitizeText(name, 64).toLowerCase().replace(/\s+/g, "_");
  const cleanDescription = sanitizeText(description, 300);

  try {
    if (action === "toggle") {
      if (!id || !isUuid(id) || typeof enabled !== "boolean") return res.status(400).json({ error: "Missing id or enabled" });
      await supabaseAdmin
        .from("feature_flags")
        .update({ enabled, updated_by: actor.id, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else if (action === "update") {
      if (!id || !isUuid(id) || !cleanName) return res.status(400).json({ error: "Missing id or name" });
      await supabaseAdmin
        .from("feature_flags")
        .update({ name: cleanName, description: cleanDescription || null, updated_by: actor.id, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else if (action === "create") {
      if (!cleanName) return res.status(400).json({ error: "Missing name" });
      await supabaseAdmin.from("feature_flags").insert({
        name: cleanName,
        enabled: Boolean(enabled),
        description: cleanDescription || null,
        updated_by: actor.id,
      });
    } else if (action === "delete") {
      if (!id || !isUuid(id)) return res.status(400).json({ error: "Missing id" });
      await supabaseAdmin.from("feature_flags").delete().eq("id", id);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_feature_flag_${action}`,
      actorId: actor.id,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { id: id ?? null, name: name ?? null, enabled: enabled ?? null },
      severity: "warning",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin feature flags action error", error);
    return res.status(500).json({ error: "Failed to execute feature flag action" });
  }
}
