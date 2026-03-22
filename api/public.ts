import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "./_lib/auth.js";
import { logSecurityEvent } from "./_lib/admin.js";
import { supabaseAdmin } from "./_lib/supabase.js";

const REVIEWS_SETTING_KEY = "public_review_rating_stats";

type ReviewsStats = {
  total: number;
  counts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

const DEFAULT_STATS: ReviewsStats = {
  total: 0,
  counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

function normalizeStats(value: unknown): ReviewsStats {
  if (!value || typeof value !== "object") return DEFAULT_STATS;
  const data = value as { total?: unknown; counts?: Record<string, unknown> };
  const counts = data.counts ?? {};
  return {
    total: Number.isFinite(Number(data.total)) ? Math.max(0, Math.floor(Number(data.total))) : 0,
    counts: {
      1: Number.isFinite(Number(counts["1"])) ? Math.max(0, Math.floor(Number(counts["1"]))) : 0,
      2: Number.isFinite(Number(counts["2"])) ? Math.max(0, Math.floor(Number(counts["2"]))) : 0,
      3: Number.isFinite(Number(counts["3"])) ? Math.max(0, Math.floor(Number(counts["3"]))) : 0,
      4: Number.isFinite(Number(counts["4"])) ? Math.max(0, Math.floor(Number(counts["4"]))) : 0,
      5: Number.isFinite(Number(counts["5"])) ? Math.max(0, Math.floor(Number(counts["5"]))) : 0,
    },
  };
}

async function getPlatformStats(res: VercelResponse) {
  const [{ count: totalProjects }, { count: totalContractors }] = await Promise.all([
    supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "contractor")
      .is("deleted_at", null),
  ]);

  return res.status(200).json({
    totalProjects: totalProjects ?? 0,
    totalContractors: totalContractors ?? 0,
    updatedAt: new Date().toISOString(),
  });
}

async function getReviews(res: VercelResponse) {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", REVIEWS_SETTING_KEY)
    .maybeSingle();
  return res.status(200).json(normalizeStats(data?.value));
}

async function voteReview(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Login required to vote" });
  }

  const stars = Number((req.body as { stars?: unknown } | null)?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: "stars must be an integer between 1 and 5" });
  }

  const { data: existingVote } = await supabaseAdmin
    .from("security_events")
    .select("id")
    .eq("event_type", "public_review_vote")
    .eq("actor_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingVote?.id) {
    return res.status(409).json({ error: "You have already voted" });
  }

  const { data } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", REVIEWS_SETTING_KEY)
    .maybeSingle();

  const current = normalizeStats(data?.value);
  current.total += 1;
  current.counts[stars as 1 | 2 | 3 | 4 | 5] += 1;

  const { error } = await supabaseAdmin.from("settings").upsert({
    key: REVIEWS_SETTING_KEY,
    value: current,
  });
  if (error) throw error;

  await logSecurityEvent({
    eventType: "public_review_vote",
    actorId: user.id,
    details: { stars },
    severity: "info",
  });

  return res.status(200).json(current);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const scope = String(req.query.scope ?? "").trim();

    if (req.method === "GET" && scope === "platform-stats") {
      return await getPlatformStats(res);
    }
    if (req.method === "GET" && scope === "reviews") {
      return await getReviews(res);
    }
    if (req.method === "POST" && scope === "reviews") {
      return await voteReview(req, res);
    }

    return res.status(404).json({ error: "Public endpoint not found" });
  } catch (error) {
    console.error("Public API error", error);
    return res.status(500).json({ error: "Failed to process public request" });
  }
}
