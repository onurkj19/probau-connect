import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const minutes = Math.max(5, Math.min(180, Number(req.query.windowMinutes ?? 60)));
    const criticalThreshold = Math.max(1, Math.min(100, Number(req.query.criticalThreshold ?? 10)));
    const warningThreshold = Math.max(1, Math.min(500, Number(req.query.warningThreshold ?? 30)));

    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("security_events")
      .select("severity")
      .gte("created_at", since);
    if (error) throw error;

    const rows = data ?? [];
    const criticalCount = rows.filter((row) => row.severity === "critical").length;
    const warningCount = rows.filter((row) => row.severity === "warning").length;

    const alerts: Array<{ level: "warning" | "critical"; title: string; details: string }> = [];
    if (criticalCount >= criticalThreshold) {
      alerts.push({
        level: "critical",
        title: "Critical security spike",
        details: `${criticalCount} critical events in last ${minutes} minutes`,
      });
    }
    if (warningCount >= warningThreshold) {
      alerts.push({
        level: "warning",
        title: "Warning-level anomaly",
        details: `${warningCount} warning events in last ${minutes} minutes`,
      });
    }

    return res.status(200).json({
      windowMinutes: minutes,
      criticalThreshold,
      warningThreshold,
      metrics: { criticalCount, warningCount },
      alerts,
    });
  } catch (error) {
    console.error("Admin alerts error", error);
    return res.status(500).json({ error: "Failed to load alerts" });
  }
}
