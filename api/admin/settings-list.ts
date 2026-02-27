import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value, updated_by, updated_at, created_at")
      .order("key", { ascending: true });
    if (error) throw error;
    return res.status(200).json({ rows: data ?? [] });
  } catch (error) {
    console.error("Admin settings list error", error);
    return res.status(500).json({ error: "Failed to load settings" });
  }
}
