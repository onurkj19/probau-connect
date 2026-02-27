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
      .from("offers")
      .select("id, project_id, contractor_id, owner_id, price_chf, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const projectIds = [...new Set(rows.map((row) => row.project_id))];
    const userIds = [...new Set(rows.flatMap((row) => [row.contractor_id, row.owner_id]))];

    const [{ data: projects }, { data: users }] = await Promise.all([
      projectIds.length > 0
        ? supabaseAdmin.from("projects").select("id, title").in("id", projectIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      userIds.length > 0
        ? supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; name: string; email: string }[] }),
    ]);

    const projectById = new Map((projects ?? []).map((p) => [p.id, p.title]));
    const userById = new Map((users ?? []).map((u) => [u.id, u]));

    return res.status(200).json({
      page,
      pageSize,
      total: count ?? 0,
      rows: rows.map((row) => ({
        ...row,
        projectTitle: projectById.get(row.project_id) ?? "",
        contractorName: userById.get(row.contractor_id)?.name ?? "",
        contractorEmail: userById.get(row.contractor_id)?.email ?? "",
        ownerName: userById.get(row.owner_id)?.name ?? "",
        ownerEmail: userById.get(row.owner_id)?.email ?? "",
      })),
    });
  } catch (error) {
    console.error("Admin offers list error", error);
    return res.status(500).json({ error: "Failed to load offers" });
  }
}
