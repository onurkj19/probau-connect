import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsePagination, requireAdmin, sanitizeText } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const { from, to, page, pageSize } = parsePagination(req);
    const severity = sanitizeText(req.query.severity, 20).toLowerCase();
    const eventType = sanitizeText(req.query.eventType, 80).toLowerCase();
    const q = sanitizeText(req.query.q, 80).toLowerCase();

    let query = supabaseAdmin
      .from("security_events")
      .select("id, event_type, actor_id, target_user_id, ip_address, user_agent, details, severity, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (severity) query = query.eq("severity", severity);
    if (eventType) query = query.ilike("event_type", `%${eventType}%`);
    if (q) query = query.or(`event_type.ilike.%${q}%,ip_address.ilike.%${q}%,user_agent.ilike.%${q}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    const rows = data ?? [];

    const userIds = [...new Set(rows.flatMap((row) => [row.actor_id, row.target_user_id].filter(Boolean) as string[]))];
    const { data: users } = userIds.length > 0
      ? await supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds)
      : { data: [] };
    const userById = new Map((users ?? []).map((u) => [u.id, u]));

    return res.status(200).json({
      page,
      pageSize,
      total: count ?? 0,
      rows: rows.map((row) => ({
        ...row,
        actorName: row.actor_id ? (userById.get(row.actor_id)?.name ?? "") : "",
        actorEmail: row.actor_id ? (userById.get(row.actor_id)?.email ?? "") : "",
        targetName: row.target_user_id ? (userById.get(row.target_user_id)?.name ?? "") : "",
        targetEmail: row.target_user_id ? (userById.get(row.target_user_id)?.email ?? "") : "",
      })),
    });
  } catch (error) {
    console.error("Admin security events list error", error);
    return res.status(500).json({ error: "Failed to load security events" });
  }
}
