import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [{ data: maintenanceRow }, { data: events }, authUsersResult] = await Promise.all([
      supabaseAdmin.from("settings").select("value").eq("key", "maintenance_banner").maybeSingle(),
      supabaseAdmin
        .from("security_events")
        .select("id, event_type, actor_id, target_user_id, ip_address, user_agent, severity, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    const users = authUsersResult.data?.users ?? [];
    const activeSessions = users
      .filter((user) => Boolean(user.last_sign_in_at))
      .map((user) => ({
        userId: user.id,
        email: user.email,
        lastSignInAt: user.last_sign_in_at,
      }));

    const failedLoginAttempts = (events ?? []).filter((event) => event.event_type === "auth_failed_login").length;
    const suspiciousActivity = (events ?? []).filter((event) => event.severity !== "info");

    return res.status(200).json({
      maintenanceMode: Boolean((maintenanceRow?.value as { enabled?: boolean } | null)?.enabled),
      activeSessions,
      failedLoginAttempts,
      suspiciousActivity,
      recentEvents: events ?? [],
    });
  } catch (error) {
    console.error("Admin security state error", error);
    return res.status(500).json({ error: "Failed to load security panel data" });
  }
}
