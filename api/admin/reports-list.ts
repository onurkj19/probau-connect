import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsePagination, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const { from, to, page, pageSize } = parsePagination(req);
    const status = String(req.query.status ?? "").trim();
    let query = supabaseAdmin
      .from("reports")
      .select("id, reporter_id, target_type, target_id, reason, status, resolved_by, resolved_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const userIds = [...new Set(rows.flatMap((r) => [r.reporter_id, r.resolved_by].filter(Boolean) as string[]))];
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
        reporterName: userById.get(row.reporter_id)?.name ?? "",
        reporterEmail: userById.get(row.reporter_id)?.email ?? "",
        resolvedByName: row.resolved_by ? (userById.get(row.resolved_by)?.name ?? "") : "",
      })),
    });
  } catch (error) {
    console.error("Admin reports list error", error);
    return res.status(500).json({ error: "Failed to load reports" });
  }
}
