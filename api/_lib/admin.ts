import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { authenticateRequest } from "./auth.js";
import { supabaseAdmin } from "./supabase.js";
import type { UserSubscription } from "./db.js";

export type AdminRole = "super_admin" | "admin" | "moderator";

const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "moderator"];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RATE_LIMIT_BUCKETS = new Map<string, { count: number; resetAt: number }>();
const IDEMPOTENCY_BUCKETS = new Map<string, number>();

interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export function parsePagination(req: VercelRequest) {
  const pageRaw = Number(req.query.page ?? 1);
  const pageSizeRaw = Number(req.query.pageSize ?? 20);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
    ? Math.min(100, Math.floor(pageSizeRaw))
    : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

export function safeJsonParse<T = Record<string, unknown>>(payload: unknown): T {
  if (!payload || typeof payload !== "object") return {} as T;
  return payload as T;
}

export function sanitizeText(value: unknown, maxLength = 120): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function getRequestIp(req: VercelRequest): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") return xff.split(",")[0]?.trim() || null;
  return req.socket.remoteAddress || null;
}

export function canAccessAdmin(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

function checkAdminRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  options: RateLimitOptions = { max: 120, windowMs: 60_000 },
): boolean {
  const ip = getRequestIp(req) || "unknown";
  const route = req.url?.split("?")[0] || "admin";
  const key = `${ip}:${route}`;
  const now = Date.now();
  const current = RATE_LIMIT_BUCKETS.get(key);

  if (!current || current.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + options.windowMs });
    return true;
  }

  if (current.count >= options.max) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
    res.status(429).json({ error: "Too many admin requests. Please retry shortly." });
    return false;
  }

  current.count += 1;
  return true;
}

function checkAdminIdempotency(req: VercelRequest, res: VercelResponse, userId: string): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const header = req.headers["x-idempotency-key"];
  const key = typeof header === "string" ? header.trim() : "";
  if (!key) {
    res.status(400).json({ error: "Missing X-Idempotency-Key header" });
    return false;
  }
  if (key.length < 8 || key.length > 128) {
    res.status(400).json({ error: "Invalid idempotency key" });
    return false;
  }

  const now = Date.now();
  const route = req.url?.split("?")[0] || "admin";
  const bucketKey = `${userId}:${route}:${key}`;
  const existingUntil = IDEMPOTENCY_BUCKETS.get(bucketKey);

  if (existingUntil && existingUntil > now) {
    res.status(409).json({ error: "Duplicate admin mutation request" });
    return false;
  }

  IDEMPOTENCY_BUCKETS.set(bucketKey, now + 10 * 60_000);
  return true;
}

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
  allowedRoles: AdminRole[] = ADMIN_ROLES,
): Promise<UserSubscription | null> {
  if (!checkAdminRateLimit(req, res)) {
    return null;
  }

  const user = await authenticateRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (!allowedRoles.includes(user.role as AdminRole)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  const { data: profileFlags } = await supabaseAdmin
    .from("profiles")
    .select("is_banned, deleted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profileFlags?.is_banned || profileFlags?.deleted_at) {
    res.status(403).json({ error: "Admin account disabled" });
    return null;
  }

  if (!checkAdminIdempotency(req, res, user.id)) {
    return null;
  }

  return user;
}

export async function logSecurityEvent(input: {
  eventType: string;
  actorId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
  severity?: "info" | "warning" | "critical";
}) {
  const {
    eventType,
    actorId = null,
    targetUserId = null,
    ipAddress = null,
    userAgent = null,
    details = {},
    severity = "info",
  } = input;

  const detailsWithChecksum = {
    ...details,
    _checksum: createHash("sha256").update(JSON.stringify(details)).digest("hex"),
  };

  const { error } = await supabaseAdmin.from("security_events").insert({
    event_type: eventType,
    actor_id: actorId,
    target_user_id: targetUserId,
    ip_address: ipAddress,
    user_agent: userAgent,
    details: detailsWithChecksum,
    severity,
  });

  if (error) {
    console.error("Failed to write security event", error);
  }
}
