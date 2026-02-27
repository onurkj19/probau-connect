import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type ReportAction = "resolve" | "reopen" | "remove_target";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  const { action, reportId, reportIds } = (req.body ?? {}) as {
    action?: ReportAction;
    reportId?: string;
    reportIds?: string[];
  };
  const targets = Array.isArray(reportIds) && reportIds.length > 0 ? reportIds : (reportId ? [reportId] : []);
  const validTargets = targets.filter(isUuid);
  if (!action || validTargets.length === 0) return res.status(400).json({ error: "Missing action or report targets" });

  try {
    const { data: reports } = await supabaseAdmin
      .from("reports")
      .select("id, target_type, target_id")
      .in("id", validTargets);
    const reportRows = reports ?? [];
    if (reportRows.length === 0) return res.status(404).json({ error: "Report not found" });

    if (action === "resolve") {
      await supabaseAdmin
        .from("reports")
        .update({ status: "resolved", resolved_by: actor.id, resolved_at: new Date().toISOString() })
        .in("id", validTargets);
    } else if (action === "reopen") {
      await supabaseAdmin
        .from("reports")
        .update({ status: "open", resolved_by: null, resolved_at: null })
        .in("id", validTargets);
    } else if (action === "remove_target") {
      for (const report of reportRows) {
        if (report.target_type === "project") {
          await supabaseAdmin.from("projects").delete().eq("id", report.target_id);
        } else if (report.target_type === "message") {
          await supabaseAdmin.from("chat_messages").delete().eq("id", report.target_id);
        } else if (report.target_type === "user") {
          await supabaseAdmin
            .from("profiles")
            .update({ is_banned: true, deleted_at: new Date().toISOString() })
            .eq("id", report.target_id);
        }
      }
      await supabaseAdmin
        .from("reports")
        .update({ status: "resolved", resolved_by: actor.id, resolved_at: new Date().toISOString() })
        .in("id", validTargets);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_report_${action}`,
      actorId: actor.id,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { targetCount: validTargets.length, reportIds: validTargets },
      severity: "critical",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin reports action error", error);
    return res.status(500).json({ error: "Failed to execute report action" });
  }
}
