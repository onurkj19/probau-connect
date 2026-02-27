import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsePagination, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const { page, pageSize, from, to } = parsePagination(req);
    const search = String(req.query.search ?? "").trim();
    const role = String(req.query.role ?? "").trim();
    const status = String(req.query.status ?? "").trim();

    let query = supabaseAdmin
      .from("profiles")
      .select(
        "id, name, email, role, plan_type, subscription_status, is_verified, is_banned, last_login_at, deleted_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (status === "banned") {
      query = query.eq("is_banned", true);
    } else if (status === "active") {
      query = query.eq("is_banned", false).is("deleted_at", null);
    } else if (status === "deleted") {
      query = query.not("deleted_at", "is", null);
    }

    const { data: users, error, count } = await query;
    if (error) throw error;

    const userRows = users ?? [];
    const ids = userRows.map((u) => u.id);

    const [projectsRes, offersRes] = ids.length > 0
      ? await Promise.all([
          supabaseAdmin.from("projects").select("owner_id").in("owner_id", ids),
          supabaseAdmin.from("offers").select("contractor_id").in("contractor_id", ids),
        ])
      : [{ data: [] }, { data: [] }];

    const projectsCountByOwner = (projectsRes.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.owner_id] = (acc[row.owner_id] ?? 0) + 1;
      return acc;
    }, {});
    const offersCountByContractor = (offersRes.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.contractor_id] = (acc[row.contractor_id] ?? 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      page,
      pageSize,
      total: count ?? 0,
      rows: userRows.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        planType: user.plan_type,
        subscriptionStatus: user.subscription_status,
        isVerified: user.is_verified,
        isBanned: user.is_banned,
        projectsCount: projectsCountByOwner[user.id] ?? 0,
        offersCount: offersCountByContractor[user.id] ?? 0,
        lastLoginAt: user.last_login_at,
        deletedAt: user.deleted_at,
      })),
    });
  } catch (error) {
    console.error("Admin users list error", error);
    return res.status(500).json({ error: "Failed to load users" });
  }
}
