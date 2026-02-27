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
    const search = String(req.query.search ?? "").trim();

    let query = supabaseAdmin
      .from("projects")
      .select("id, owner_id, title, category, service, deadline, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%,service.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
    const { data: owners } = ownerIds.length > 0
      ? await supabaseAdmin.from("profiles").select("id, name, email").in("id", ownerIds)
      : { data: [] };

    const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

    return res.status(200).json({
      page,
      pageSize,
      total: count ?? 0,
      rows: rows.map((row) => ({
        ...row,
        ownerName: ownerById.get(row.owner_id)?.name ?? "",
        ownerEmail: ownerById.get(row.owner_id)?.email ?? "",
      })),
    });
  } catch (error) {
    console.error("Admin projects list error", error);
    return res.status(500).json({ error: "Failed to load projects" });
  }
}
