import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  const startedAt = Date.now();
  try {
    const [{ count: profileCount }, { count: projectCount }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
    ]);

    return res.status(200).json({
      status: "ok",
      latencyMs: Date.now() - startedAt,
      checks: {
        dbConnection: true,
        profilesReachable: typeof profileCount === "number",
        projectsReachable: typeof projectCount === "number",
      },
      sampledCounts: {
        profiles: profileCount ?? 0,
        projects: projectCount ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin health error", error);
    return res.status(500).json({
      status: "degraded",
      latencyMs: Date.now() - startedAt,
      checks: { dbConnection: false },
      timestamp: new Date().toISOString(),
    });
  }
}
