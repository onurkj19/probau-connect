import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

const PLAN_PRICING: Record<string, number> = {
  basic: 79,
  pro: 149,
};

type DailyPoint = {
  date: string;
  count: number;
};

function buildDailySeries(days: number, timestamps: string[]): DailyPoint[] {
  const now = new Date();
  const dayBuckets = new Map<string, number>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    dayBuckets.set(key, 0);
  }

  for (const ts of timestamps) {
    const key = new Date(ts).toISOString().slice(0, 10);
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [{ count: totalUsers }, { count: totalProjects }, { count: totalOffers }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("offers").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("id, plan_type, subscription_status, created_at, last_login_at")
        .is("deleted_at", null),
    ]);

    const profileRows = profiles ?? [];
    const activeUsers7d = profileRows.filter((row) =>
      row.last_login_at && new Date(row.last_login_at).getTime() >= sevenDaysAgo.getTime()
    ).length;

    const payingUsers = profileRows.filter((row) =>
      row.subscription_status === "active" && Boolean(row.plan_type)
    );
    const activeSubscriptions = payingUsers.length;
    const mrr = payingUsers.reduce((sum, row) => sum + (PLAN_PRICING[row.plan_type ?? ""] ?? 0), 0);

    const newUsers30dTimestamps = profileRows
      .filter((row) => new Date(row.created_at).getTime() >= thirtyDaysAgo.getTime())
      .map((row) => row.created_at);
    const newUsersSeries = buildDailySeries(30, newUsers30dTimestamps);

    const conversionRate = totalUsers && totalUsers > 0
      ? Number(((activeSubscriptions / totalUsers) * 100).toFixed(2))
      : 0;

    res.setHeader("Cache-Control", "private, max-age=30");
    return res.status(200).json({
      totals: {
        totalUsers: totalUsers ?? 0,
        activeUsers7d,
        totalProjects: totalProjects ?? 0,
        totalOffers: totalOffers ?? 0,
        activeSubscriptions,
        mrr,
        conversionRate,
      },
      series: {
        newUsers30d: newUsersSeries,
      },
    });
  } catch (error) {
    console.error("Admin overview error", error);
    return res.status(500).json({ error: "Failed to load overview metrics" });
  }
}
