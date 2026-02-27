import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type ProjectAction = "close" | "reopen" | "delete";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  const { action, projectId, projectIds } = (req.body ?? {}) as {
    action?: ProjectAction;
    projectId?: string;
    projectIds?: string[];
  };
  const targets = Array.isArray(projectIds) && projectIds.length > 0 ? projectIds : (projectId ? [projectId] : []);
  const validTargets = targets.filter(isUuid);
  if (!action || validTargets.length === 0) return res.status(400).json({ error: "Missing action or project targets" });

  try {
    if (action === "close") {
      await supabaseAdmin.from("projects").update({ status: "closed" }).in("id", validTargets);
    } else if (action === "reopen") {
      await supabaseAdmin.from("projects").update({ status: "active" }).in("id", validTargets);
    } else if (action === "delete") {
      await supabaseAdmin.from("projects").delete().in("id", validTargets);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_project_${action}`,
      actorId: actor.id,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { targetCount: validTargets.length, projectIds: validTargets },
      severity: "warning",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin projects action error", error);
    return res.status(500).json({ error: "Failed to execute project action" });
  }
}
