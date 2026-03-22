import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../_lib/auth.js";
import { supabaseAdmin } from "../_lib/supabase.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { ids, all } = (req.body ?? {}) as {
      ids?: string[];
      all?: boolean;
    };

    if (all === true) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      return res.status(200).json({ success: true, deleted: "all" });
    }

    const cleanIds = (Array.isArray(ids) ? ids : [])
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id.length > 0 && isUuid(id));

    if (cleanIds.length === 0) {
      return res.status(400).json({ error: "No valid notification ids provided" });
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .in("id", cleanIds);

    if (error) throw error;

    return res.status(200).json({ success: true, deleted: cleanIds.length });
  } catch (error) {
    console.error("Notification delete error", error);
    return res.status(500).json({ error: "Failed to delete notifications" });
  }
}
