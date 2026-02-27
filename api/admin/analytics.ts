import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type SeriesPoint = { date: string; value: number };

function buildDateKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function countSeries(days: number, timestamps: string[]): SeriesPoint[] {
  const keys = buildDateKeys(days);
  const map = new Map<string, number>(keys.map((k) => [k, 0]));
  for (const ts of timestamps) {
    const key = new Date(ts).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return keys.map((date) => ({ date, value: map.get(date) ?? 0 }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const days = Math.max(7, Math.min(180, Number(req.query.days ?? 90)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [profilesRes, projectsRes, offersRes, reportsRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, role, plan_type, subscription_status, created_at, last_login_at")
        .is("deleted_at", null),
      supabaseAdmin
        .from("projects")
        .select("id, owner_id, created_at, status")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("offers")
        .select("id, contractor_id, created_at, status")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("reports")
        .select("id, status, created_at")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("security_events")
        .select("id, severity, created_at")
        .gte("created_at", since.toISOString()),
    ]);

    const profiles = profilesRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const offers = offersRes.data ?? [];
    const reports = reportsRes.data ?? [];
    const events = eventsRes.data ?? [];

    const payingUsers = profiles.filter((p) => p.subscription_status === "active" && Boolean(p.plan_type)).length;
    const projectOwners = profiles.filter((p) => p.role === "project_owner").length;
    const contractors = profiles.filter((p) => p.role === "contractor").length;
    const ownersWithProjects = new Set(projects.map((p) => p.owner_id)).size;
    const contractorsWithOffers = new Set(offers.map((o) => o.contractor_id)).size;

    const retentionWindow = new Date();
    retentionWindow.setDate(retentionWindow.getDate() - 30);
    const retentionEligible = profiles.filter((p) => new Date(p.created_at).getTime() < retentionWindow.getTime());
    const retained = retentionEligible.filter((p) =>
      p.last_login_at && new Date(p.last_login_at).getTime() >= retentionWindow.getTime()
    ).length;
    const retentionRate = retentionEligible.length > 0 ? Number(((retained / retentionEligible.length) * 100).toFixed(2)) : 0;

    const warningEvents = events.filter((e) => e.severity === "warning").length;
    const criticalEvents = events.filter((e) => e.severity === "critical").length;

    res.setHeader("Cache-Control", "private, max-age=45");
    return res.status(200).json({
      windowDays: days,
      kpis: {
        projectOwners,
        contractors,
        payingUsers,
        retentionRate30d: retentionRate,
        openReports: reports.filter((r) => r.status === "open").length,
        warningEvents,
        criticalEvents,
      },
      funnel: {
        totalUsers: profiles.length,
        ownersWithProjects,
        contractorsWithOffers,
        payingUsers,
      },
      series: {
        users: countSeries(days, profiles.map((p) => p.created_at).filter((ts) => new Date(ts).getTime() >= since.getTime())),
        projects: countSeries(days, projects.map((p) => p.created_at)),
        offers: countSeries(days, offers.map((o) => o.created_at)),
        reports: countSeries(days, reports.map((r) => r.created_at)),
      },
    });
  } catch (error) {
    console.error("Admin analytics error", error);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}
