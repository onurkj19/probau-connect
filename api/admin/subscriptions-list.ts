import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

const PLAN_PRICING: Record<string, number> = {
  basic: 79,
  pro: 149,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, stripe_customer_id, plan_type, subscription_status, subscription_current_period_end")
      .not("stripe_customer_id", "is", null)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    const rows = data ?? [];
    const payingRows = rows.filter((row) => row.subscription_status === "active" && row.plan_type);
    const mrr = payingRows.reduce((sum, row) => sum + (PLAN_PRICING[row.plan_type ?? ""] ?? 0), 0);

    return res.status(200).json({
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        stripeCustomerId: row.stripe_customer_id,
        planType: row.plan_type,
        status: row.subscription_status,
        renewalDate: row.subscription_current_period_end,
      })),
      summary: {
        totalCustomers: rows.length,
        activeSubscriptions: payingRows.length,
        mrr,
      },
    });
  } catch (error) {
    console.error("Admin subscriptions list error", error);
    return res.status(500).json({ error: "Failed to load subscriptions" });
  }
}
