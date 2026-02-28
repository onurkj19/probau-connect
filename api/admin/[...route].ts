import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { getRequestIp, isUuid, logSecurityEvent, parsePagination, requireAdmin, safeJsonParse, sanitizeText } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";
import { getPlanByPriceId, stripe } from "../_lib/stripe.js";

const PLAN_PRICING: Record<string, number> = { basic: 79, pro: 149 };
const SUBSCRIPTION_DISCOUNT_SETTING_KEY = "subscription_discount_config";

interface SubscriptionDiscountConfig {
  enabled: boolean;
  percentOff: number;
  couponId: string | null;
  updatedAt: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Unexpected error";
}

async function getSubscriptionDiscountConfig(): Promise<SubscriptionDiscountConfig> {
  const { data: row } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", SUBSCRIPTION_DISCOUNT_SETTING_KEY)
    .maybeSingle();
  const raw = (row?.value as Partial<SubscriptionDiscountConfig> | null) ?? null;
  return {
    enabled: Boolean(raw?.enabled),
    percentOff: Number(raw?.percentOff ?? 0),
    couponId: typeof raw?.couponId === "string" ? raw.couponId : null,
    updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : null,
  };
}

async function createPromotionCodeDirect(params: {
  couponId: string;
  code: string;
  maxRedemptions: number | null;
  expiresAtTimestamp?: number;
  actorId: string;
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  const body = new URLSearchParams();
  body.set("promotion[type]", "coupon");
  body.set("promotion[coupon]", params.couponId);
  body.set("code", params.code);
  body.set("metadata[source]", "admin_subscription_promo_code");
  body.set("metadata[actorId]", params.actorId);
  if (params.maxRedemptions !== null) {
    body.set("max_redemptions", String(params.maxRedemptions));
  }
  if (typeof params.expiresAtTimestamp === "number") {
    body.set("expires_at", String(params.expiresAtTimestamp));
  }
  const response = await fetch("https://api.stripe.com/v1/promotion_codes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Stripe promotion code creation failed");
  }
}

function getRoutePath(req: VercelRequest): string {
  const raw = req.query.route;
  if (Array.isArray(raw)) return raw.join("/");
  if (typeof raw === "string") return raw;
  return "";
}

function buildDailySeries(days: number, timestamps: string[]) {
  const now = new Date();
  const dayBuckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    dayBuckets.set(date.toISOString().slice(0, 10), 0);
  }
  for (const ts of timestamps) {
    const key = new Date(ts).toISOString().slice(0, 10);
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  return Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));
}

function countSeries(days: number, timestamps: string[]) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  const map = new Map<string, number>(keys.map((k) => [k, 0]));
  for (const ts of timestamps) {
    const key = new Date(ts).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return keys.map((date) => ({ date, value: map.get(date) ?? 0 }));
}

async function fetchUserMetaByIds(ids: string[]) {
  if (ids.length === 0) return new Map<string, { name: string; email: string }>();
  const { data } = await supabaseAdmin.from("profiles").select("id, name, email").in("id", ids);
  return new Map((data ?? []).map((u) => [u.id, { name: u.name, email: u.email }]));
}

async function setAuthBanStatus(userIds: string[], isBanned: boolean) {
  if (userIds.length === 0) return;
  const banDuration = isBanned ? "876000h" : "none";
  await Promise.all(
    userIds.map(async (id) => {
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: banDuration });
    }),
  );
}

async function handleOverview(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const [{ count: totalUsers }, { count: totalProjects }, { count: totalOffers }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("offers").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id, plan_type, subscription_status, created_at, last_login_at").is("deleted_at", null),
  ]);
  const profileRows = profiles ?? [];
  const activeUsers7d = profileRows.filter((row) => row.last_login_at && new Date(row.last_login_at).getTime() >= sevenDaysAgo.getTime()).length;
  const payingUsers = profileRows.filter((row) => row.subscription_status === "active" && Boolean(row.plan_type));
  const activeSubscriptions = payingUsers.length;
  const mrr = payingUsers.reduce((sum, row) => sum + (PLAN_PRICING[row.plan_type ?? ""] ?? 0), 0);
  const newUsersSeries = buildDailySeries(
    30,
    profileRows.filter((row) => new Date(row.created_at).getTime() >= thirtyDaysAgo.getTime()).map((row) => row.created_at),
  );
  const conversionRate = totalUsers && totalUsers > 0 ? Number(((activeSubscriptions / totalUsers) * 100).toFixed(2)) : 0;
  res.setHeader("Cache-Control", "private, max-age=30");
  return res.status(200).json({
    totals: {
      totalUsers: totalUsers ?? 0,
      activeUsers7d,
      totalProjects: totalProjects ?? 0,
      totalOffers: totalOffers ?? 0,
      activeSubscriptions,
      mrr,
      conversionRate,
    },
    series: { newUsers30d: newUsersSeries },
  });
}

async function handleUsersList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { page, pageSize, from, to } = parsePagination(req);
  const search = String(req.query.search ?? "").trim();
  const role = String(req.query.role ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  let query = supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, plan_type, subscription_status, is_verified, is_banned, last_login_at, deleted_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (search) {
    if (isUuid(search)) query = query.eq("id", search);
    else query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
  }
  if (role) query = query.eq("role", role);
  if (status === "banned") query = query.eq("is_banned", true);
  else if (status === "active") query = query.eq("is_banned", false).is("deleted_at", null);
  else if (status === "deleted") query = query.not("deleted_at", "is", null);
  const { data: users, count } = await query;
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
}

async function handleUsersAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { action, userId, userIds, role, planType, subscriptionStatus } = (req.body ?? {}) as {
    action?: string;
    userId?: string;
    userIds?: string[];
    role?: "super_admin" | "admin" | "moderator" | "project_owner" | "contractor";
    planType?: "basic" | "pro" | null;
    subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
  };
  const targetIds = Array.isArray(userIds) && userIds.length > 0 ? userIds : (userId ? [userId] : []);
  const validTargetIds = targetIds.filter(isUuid);
  if (!action || validTargetIds.length === 0) return res.status(400).json({ error: "Missing action or valid user targets" });
  if (action === "change_role" && actor.role === "moderator") return res.status(403).json({ error: "Moderators cannot change roles" });
  if (action === "set_subscription" && actor.role === "moderator") return res.status(403).json({ error: "Moderators cannot change subscriptions" });
  const protectedActions = new Set([
    "ban",
    "unban",
    "verify",
    "unverify",
    "change_role",
    "set_subscription",
    "soft_delete",
    "impersonate",
  ]);
  if (protectedActions.has(action)) {
    const { data: targetRoles } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .in("id", validTargetIds);
    const hasSuperAdminTarget = (targetRoles ?? []).some((row) => row.role === "super_admin");
    if (hasSuperAdminTarget) {
      return res.status(403).json({ error: "Super admin accounts are untouchable" });
    }
  }

  if (action === "ban") {
    await supabaseAdmin.from("profiles").update({ is_banned: true }).in("id", validTargetIds);
    await setAuthBanStatus(validTargetIds, true);
  } else if (action === "unban") {
    await supabaseAdmin.from("profiles").update({ is_banned: false }).in("id", validTargetIds);
    await setAuthBanStatus(validTargetIds, false);
  }
  else if (action === "verify") await supabaseAdmin.from("profiles").update({ is_verified: true }).in("id", validTargetIds);
  else if (action === "unverify") await supabaseAdmin.from("profiles").update({ is_verified: false }).in("id", validTargetIds);
  else if (action === "change_role") {
    if (!role) return res.status(400).json({ error: "Missing role" });
    await supabaseAdmin.from("profiles").update({ role }).in("id", validTargetIds);
  } else if (action === "set_subscription") {
    await supabaseAdmin.from("profiles").update({ plan_type: planType ?? null, subscription_status: subscriptionStatus ?? "none" }).in("id", validTargetIds);
  } else if (action === "soft_delete") {
    await supabaseAdmin.from("profiles").update({ deleted_at: new Date().toISOString(), is_banned: true }).in("id", validTargetIds);
    await setAuthBanStatus(validTargetIds, true);
  } else if (action === "impersonate") {
    if (validTargetIds.length !== 1) return res.status(400).json({ error: "Impersonation requires a single user target" });
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await logSecurityEvent({
      eventType: "admin_impersonation_issued",
      actorId: actor.id,
      targetUserId: validTargetIds[0],
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      severity: "warning",
      details: { token, expiresAt },
    });
    return res.status(200).json({ success: true, token, expiresAt, targetUserId: validTargetIds[0] });
  } else return res.status(400).json({ error: "Unsupported action" });

  await logSecurityEvent({
    eventType: `admin_user_${action}`,
    actorId: actor.id,
    targetUserId: validTargetIds[0] ?? null,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { role, planType, subscriptionStatus, targetCount: validTargetIds.length, targetIds: validTargetIds },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleSimpleList(req: VercelRequest, res: VercelResponse, table: "projects" | "offers" | "reports" | "chats" | "feature_flags" | "settings" | "security_events" | "subscriptions") {
  if (table === "subscriptions") {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, stripe_customer_id, plan_type, subscription_status, subscription_current_period_end")
      .not("stripe_customer_id", "is", null)
      .order("updated_at", { ascending: false });
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
      summary: { totalCustomers: rows.length, activeSubscriptions: payingRows.length, mrr },
    });
  }
  return res.status(500).json({ error: "Unsupported list helper" });
}

async function handleSubscriptionsAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;
  const { action, userId, stripeCustomerId, extraDays } = (req.body ?? {}) as {
    action?: "force_sync" | "extend" | "revoke";
    userId?: string;
    stripeCustomerId?: string;
    extraDays?: number;
  };
  if (!action || !userId || !isUuid(userId)) return res.status(400).json({ error: "Missing action or userId" });
  if (action === "force_sync") {
    if (!stripeCustomerId) return res.status(400).json({ error: "Missing stripeCustomerId" });
    const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomerId, limit: 5, status: "all" });
    const activeSub = subscriptions.data.find((sub) => ["active", "trialing", "past_due"].includes(sub.status));
    if (!activeSub) {
      await supabaseAdmin.from("profiles").update({ subscription_status: "none", plan_type: null, subscription_current_period_end: null }).eq("id", userId);
    } else {
      const maybePriceId = activeSub.items.data[0]?.price?.id;
      const mappedPlan = maybePriceId ? getPlanByPriceId(maybePriceId) : undefined;
      const maybeCurrentPeriodEnd = (activeSub as unknown as { current_period_end?: number }).current_period_end;
      const periodEndIso = typeof maybeCurrentPeriodEnd === "number" ? new Date(maybeCurrentPeriodEnd * 1000).toISOString() : null;
      await supabaseAdmin.from("profiles").update({
        subscription_status: activeSub.status === "trialing" ? "active" : (activeSub.status as "active" | "past_due" | "canceled"),
        plan_type: mappedPlan?.type ?? null,
        subscription_current_period_end: periodEndIso,
      }).eq("id", userId);
    }
  } else if (action === "extend") {
    const { data: profile } = await supabaseAdmin.from("profiles").select("subscription_current_period_end, subscription_status").eq("id", userId).single();
    const base = profile?.subscription_current_period_end ? new Date(profile.subscription_current_period_end) : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + Math.max(1, Number(extraDays) || 30));
    await supabaseAdmin.from("profiles").update({
      subscription_status: profile?.subscription_status === "none" ? "active" : profile?.subscription_status,
      subscription_current_period_end: next.toISOString(),
    }).eq("id", userId);
  } else if (action === "revoke") {
    await supabaseAdmin.from("profiles").update({ subscription_status: "canceled", plan_type: null, subscription_current_period_end: null }).eq("id", userId);
  } else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_subscription_${action}`,
    actorId: actor.id,
    targetUserId: userId,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { extraDays: extraDays ?? null },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleSubscriptionPromosList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res, ["super_admin"]);
  if (!actor) return;
  const [discountConfig, activeCodesRes, inactiveCodesRes] = await Promise.all([
    getSubscriptionDiscountConfig(),
    stripe.promotionCodes.list({ limit: 100, active: true }),
    stripe.promotionCodes.list({ limit: 100, active: false }),
  ]);
  const mergedCodes = [...activeCodesRes.data, ...inactiveCodesRes.data];
  return res.status(200).json({
    discountConfig,
    promoCodes: mergedCodes
      .map((promo) => {
        const legacyCoupon = promo.coupon && typeof promo.coupon !== "string" ? promo.coupon as Stripe.Coupon : null;
        const promotionCoupon = promo.promotion?.coupon && typeof promo.promotion.coupon !== "string"
          ? promo.promotion.coupon as Stripe.Coupon
          : null;
        const coupon = legacyCoupon ?? promotionCoupon;
        if (!promo.code || !coupon || coupon.percent_off === null) return null;
        return {
          id: promo.id,
          code: promo.code,
          active: promo.active,
          percentOff: Number(coupon.percent_off ?? 0),
          maxRedemptions: promo.max_redemptions ?? null,
          timesRedeemed: promo.times_redeemed ?? 0,
          expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000).toISOString() : null,
          createdAt: new Date(promo.created * 1000).toISOString(),
        };
      })
      .filter((row): row is {
        id: string;
        code: string;
        active: boolean;
        percentOff: number;
        maxRedemptions: number | null;
        timesRedeemed: number;
        expiresAt: string | null;
        createdAt: string;
      } => Boolean(row))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
}

async function handleSubscriptionPromosAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res, ["super_admin"]);
  if (!actor) return;
  const { action, percentOff, code, maxRedemptions, expiresAt, promotionCodeId } = (req.body ?? {}) as {
    action?: "set_default_discount" | "create_promo_code" | "deactivate_promo_code";
    percentOff?: number;
    code?: string;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
    promotionCodeId?: string;
  };
  if (!action) return res.status(400).json({ error: "Missing action" });

  if (action === "set_default_discount") {
    const cleanPercent = Number(percentOff);
    if (!Number.isFinite(cleanPercent) || cleanPercent < 0 || cleanPercent > 100) {
      return res.status(400).json({ error: "percentOff must be between 0 and 100" });
    }
    const roundedPercent = Number(cleanPercent.toFixed(2));
    if (roundedPercent === 0) {
      await supabaseAdmin.from("settings").upsert({
        key: SUBSCRIPTION_DISCOUNT_SETTING_KEY,
        value: {
          enabled: false,
          percentOff: 0,
          couponId: null,
          updatedAt: new Date().toISOString(),
        },
        updated_by: actor.id,
      });
    } else {
      let coupon: Stripe.Coupon;
      try {
        coupon = await stripe.coupons.create({
          percent_off: roundedPercent,
          duration: "forever",
          name: `Default subscription discount ${roundedPercent}%`,
          metadata: {
            source: "admin_default_subscription_discount",
            actorId: actor.id,
          },
        });
      } catch (error) {
        return res.status(400).json({ error: `Failed to create default discount coupon: ${getErrorMessage(error)}` });
      }
      await supabaseAdmin.from("settings").upsert({
        key: SUBSCRIPTION_DISCOUNT_SETTING_KEY,
        value: {
          enabled: true,
          percentOff: roundedPercent,
          couponId: coupon.id,
          updatedAt: new Date().toISOString(),
        },
        updated_by: actor.id,
      });
    }
  } else if (action === "create_promo_code") {
    const cleanCode = sanitizeText(code, 32).toUpperCase();
    const cleanPercent = Number(percentOff);
    if (!/^[A-Z0-9_-]{3,32}$/.test(cleanCode)) return res.status(400).json({ error: "Invalid promo code format" });
    if (!Number.isFinite(cleanPercent) || cleanPercent <= 0 || cleanPercent > 100) {
      return res.status(400).json({ error: "percentOff must be between 1 and 100" });
    }
    const roundedPercent = Number(cleanPercent.toFixed(2));
    const cleanMaxRedemptions = maxRedemptions === null || typeof maxRedemptions === "undefined"
      ? null
      : Math.max(1, Math.floor(Number(maxRedemptions)));
    if (cleanMaxRedemptions !== null && !Number.isFinite(cleanMaxRedemptions)) {
      return res.status(400).json({ error: "Invalid maxRedemptions" });
    }
    let expiresAtTimestamp: number | undefined;
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return res.status(400).json({ error: "expiresAt must be a valid future date" });
      }
      expiresAtTimestamp = Math.floor(parsed.getTime() / 1000);
    }
    const [existingActive, existingInactive] = await Promise.all([
      stripe.promotionCodes.list({ code: cleanCode, active: true, limit: 1 }),
      stripe.promotionCodes.list({ code: cleanCode, active: false, limit: 1 }),
    ]);
    if ((existingActive.data?.length ?? 0) > 0 || (existingInactive.data?.length ?? 0) > 0) {
      return res.status(409).json({ error: "Promo code already exists. Please use a different code." });
    }
    let coupon: Stripe.Coupon;
    try {
      coupon = await stripe.coupons.create({
        percent_off: roundedPercent,
        duration: "forever",
        name: `Promo ${cleanCode} (${roundedPercent}%)`,
        metadata: {
          source: "admin_subscription_promo_code",
          actorId: actor.id,
          code: cleanCode,
        },
      });
      await createPromotionCodeDirect({
        couponId: coupon.id,
        code: cleanCode,
        maxRedemptions: cleanMaxRedemptions,
        expiresAtTimestamp,
        actorId: actor.id,
      });
    } catch (error) {
      return res.status(400).json({ error: `Failed to create promo code: ${getErrorMessage(error)}` });
    }
  } else if (action === "deactivate_promo_code") {
    const cleanId = sanitizeText(promotionCodeId, 120);
    if (!cleanId) return res.status(400).json({ error: "Missing promotionCodeId" });
    await stripe.promotionCodes.update(cleanId, { active: false });
  } else {
    return res.status(400).json({ error: "Unsupported action" });
  }

  await logSecurityEvent({
    eventType: `admin_subscription_promos_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: {
      percentOff: typeof percentOff === "number" ? Number(percentOff.toFixed(2)) : null,
      code: sanitizeText(code, 32).toUpperCase() || null,
      promotionCodeId: sanitizeText(promotionCodeId, 120) || null,
    },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleSecurityState(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const [{ data: maintenanceRow }, { data: events }, authUsersResult] = await Promise.all([
    supabaseAdmin.from("settings").select("value").eq("key", "maintenance_banner").maybeSingle(),
    supabaseAdmin
      .from("security_events")
      .select("id, event_type, actor_id, target_user_id, ip_address, user_agent, severity, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);
  const users = authUsersResult.data?.users ?? [];
  const activeSessions = users
    .filter((user) => Boolean(user.last_sign_in_at))
    .map((user) => ({ userId: user.id, email: user.email, lastSignInAt: user.last_sign_in_at }));
  const failedLoginAttempts = (events ?? []).filter((event) => event.event_type === "auth_failed_login").length;
  const suspiciousActivity = (events ?? []).filter((event) => event.severity !== "info");
  return res.status(200).json({
    maintenanceMode: Boolean((maintenanceRow?.value as { enabled?: boolean } | null)?.enabled),
    activeSessions,
    failedLoginAttempts,
    suspiciousActivity,
    recentEvents: events ?? [],
  });
}

async function handleSecurityAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;
  const { action, targetUserId, enabled, message } = (req.body ?? {}) as {
    action?: "force_logout_all" | "force_logout_user" | "maintenance_mode";
    targetUserId?: string;
    enabled?: boolean;
    message?: string;
  };
  if (!action) return res.status(400).json({ error: "Missing action" });
  if (action === "maintenance_mode") {
    await supabaseAdmin.from("settings").upsert({
      key: "maintenance_banner",
      value: { enabled: Boolean(enabled), message: message ?? "" },
      updated_by: actor.id,
    });
  } else if (action === "force_logout_all") {
    await supabaseAdmin.from("settings").upsert({
      key: "session_force_logout_at",
      value: { timestamp: new Date().toISOString() },
      updated_by: actor.id,
    });
  } else if (action === "force_logout_user") {
    if (!targetUserId || !isUuid(targetUserId)) return res.status(400).json({ error: "Missing targetUserId" });
    await supabaseAdmin.from("profiles").update({ is_banned: true }).eq("id", targetUserId);
  } else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_security_${action}`,
    actorId: actor.id,
    targetUserId: targetUserId ?? null,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { enabled: enabled ?? null, message: message ?? null },
    severity: "critical",
  });
  return res.status(200).json({ success: true });
}

async function handleProjectsList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { from, to, page, pageSize } = parsePagination(req);
  const status = String(req.query.status ?? "").trim();
  const search = String(req.query.search ?? "").trim();
  let query = supabaseAdmin
    .from("projects")
    .select("id, owner_id, title, category, custom_category, service, deadline, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status) query = query.eq("status", status);
  if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%,custom_category.ilike.%${search}%,service.ilike.%${search}%`);
  const { data, count } = await query;
  const rows = data ?? [];
  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
  const ownerById = await fetchUserMetaByIds(ownerIds);
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
}

async function handleProjectsAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { action, projectId, projectIds } = (req.body ?? {}) as { action?: "close" | "reopen" | "delete"; projectId?: string; projectIds?: string[] };
  const targets = Array.isArray(projectIds) && projectIds.length > 0 ? projectIds : (projectId ? [projectId] : []);
  const validTargets = targets.filter(isUuid);
  if (!action || validTargets.length === 0) return res.status(400).json({ error: "Missing action or project targets" });
  if (action === "close") await supabaseAdmin.from("projects").update({ status: "closed" }).in("id", validTargets);
  else if (action === "reopen") await supabaseAdmin.from("projects").update({ status: "active" }).in("id", validTargets);
  else if (action === "delete") await supabaseAdmin.from("projects").delete().in("id", validTargets);
  else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_project_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { targetCount: validTargets.length, projectIds: validTargets },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleOffersList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { from, to, page, pageSize } = parsePagination(req);
  const status = String(req.query.status ?? "").trim();
  let query = supabaseAdmin
    .from("offers")
    .select("id, project_id, contractor_id, owner_id, price_chf, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status) query = query.eq("status", status);
  const { data, count } = await query;
  const rows = data ?? [];
  const projectIds = [...new Set(rows.map((row) => row.project_id))];
  const userIds = [...new Set(rows.flatMap((row) => [row.contractor_id, row.owner_id]))];
  const [{ data: projects }, userById] = await Promise.all([
    projectIds.length > 0 ? supabaseAdmin.from("projects").select("id, title").in("id", projectIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    fetchUserMetaByIds(userIds),
  ]);
  const projectById = new Map((projects ?? []).map((p) => [p.id, p.title]));
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
}

async function handleOffersAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { action, offerId, offerIds } = (req.body ?? {}) as { action?: "accept" | "reject" | "delete"; offerId?: string; offerIds?: string[] };
  const targets = Array.isArray(offerIds) && offerIds.length > 0 ? offerIds : (offerId ? [offerId] : []);
  const validTargets = targets.filter(isUuid);
  if (!action || validTargets.length === 0) return res.status(400).json({ error: "Missing action or offer targets" });
  if (action === "accept") await supabaseAdmin.from("offers").update({ status: "accepted" }).in("id", validTargets);
  else if (action === "reject") await supabaseAdmin.from("offers").update({ status: "rejected" }).in("id", validTargets);
  else if (action === "delete") await supabaseAdmin.from("offers").delete().in("id", validTargets);
  else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_offer_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { targetCount: validTargets.length, offerIds: validTargets },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleConversationsList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { from, to, page, pageSize } = parsePagination(req);
  const { data, count } = await supabaseAdmin
    .from("chats")
    .select("id, project_id, owner_id, contractor_id, project_title, created_at, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);
  const rows = data ?? [];
  const chatIds = rows.map((row) => row.id);
  const userIds = [...new Set(rows.flatMap((row) => [row.owner_id, row.contractor_id]))];
  const [messagesRes, userById] = await Promise.all([
    chatIds.length > 0 ? supabaseAdmin.from("chat_messages").select("id, chat_id, created_at").in("chat_id", chatIds) : Promise.resolve({ data: [] as { id: string; chat_id: string; created_at: string }[] }),
    fetchUserMetaByIds(userIds),
  ]);
  const messages = messagesRes.data ?? [];
  const messageCountByChat = messages.reduce<Record<string, number>>((acc, row) => {
    acc[row.chat_id] = (acc[row.chat_id] ?? 0) + 1;
    return acc;
  }, {});
  const lastMessageAtByChat = messages.reduce<Record<string, string | null>>((acc, row) => {
    const current = acc[row.chat_id];
    if (!current || new Date(row.created_at).getTime() > new Date(current).getTime()) acc[row.chat_id] = row.created_at;
    return acc;
  }, {});
  return res.status(200).json({
    page,
    pageSize,
    total: count ?? 0,
    rows: rows.map((row) => ({
      ...row,
      ownerName: userById.get(row.owner_id)?.name ?? "",
      ownerEmail: userById.get(row.owner_id)?.email ?? "",
      contractorName: userById.get(row.contractor_id)?.name ?? "",
      contractorEmail: userById.get(row.contractor_id)?.email ?? "",
      messageCount: messageCountByChat[row.id] ?? 0,
      lastMessageAt: lastMessageAtByChat[row.id] ?? null,
    })),
  });
}

async function handleConversationsAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { action, chatId, blockerId, blockedId } = (req.body ?? {}) as {
    action?: "delete_chat" | "clear_messages" | "block_user" | "unblock_user";
    chatId?: string;
    blockerId?: string;
    blockedId?: string;
  };
  if (!action) return res.status(400).json({ error: "Missing action" });
  if (action === "delete_chat") {
    if (!chatId || !isUuid(chatId)) return res.status(400).json({ error: "Missing chatId" });
    await supabaseAdmin.from("chats").delete().eq("id", chatId);
  } else if (action === "clear_messages") {
    if (!chatId || !isUuid(chatId)) return res.status(400).json({ error: "Missing chatId" });
    await supabaseAdmin.from("chat_messages").delete().eq("chat_id", chatId);
  } else if (action === "block_user") {
    if (!blockerId || !blockedId || !isUuid(blockerId) || !isUuid(blockedId)) return res.status(400).json({ error: "Missing blockerId or blockedId" });
    await supabaseAdmin.from("blocked_users").upsert({ blocker_id: blockerId, blocked_id: blockedId });
  } else if (action === "unblock_user") {
    if (!blockerId || !blockedId || !isUuid(blockerId) || !isUuid(blockedId)) return res.status(400).json({ error: "Missing blockerId or blockedId" });
    await supabaseAdmin.from("blocked_users").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  } else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_conversation_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { chatId: chatId ?? null, blockerId: blockerId ?? null, blockedId: blockedId ?? null },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleReportsList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { from, to, page, pageSize } = parsePagination(req);
  const status = String(req.query.status ?? "").trim();
  let query = supabaseAdmin
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, status, resolved_by, resolved_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status) query = query.eq("status", status);
  const { data, count } = await query;
  const rows = data ?? [];
  const userIds = [...new Set(rows.flatMap((r) => [r.reporter_id, r.resolved_by].filter(Boolean) as string[]))];
  const userById = await fetchUserMetaByIds(userIds);
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
}

async function handleReportsAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { action, reportId, reportIds } = (req.body ?? {}) as {
    action?: "resolve" | "reopen" | "remove_target";
    reportId?: string;
    reportIds?: string[];
  };
  const targets = Array.isArray(reportIds) && reportIds.length > 0 ? reportIds : (reportId ? [reportId] : []);
  const validTargets = targets.filter(isUuid);
  if (!action || validTargets.length === 0) return res.status(400).json({ error: "Missing action or report targets" });
  const { data: reports } = await supabaseAdmin.from("reports").select("id, target_type, target_id").in("id", validTargets);
  const reportRows = reports ?? [];
  if (reportRows.length === 0) return res.status(404).json({ error: "Report not found" });
  if (action === "resolve") {
    await supabaseAdmin.from("reports").update({ status: "resolved", resolved_by: actor.id, resolved_at: new Date().toISOString() }).in("id", validTargets);
  } else if (action === "reopen") {
    await supabaseAdmin.from("reports").update({ status: "open", resolved_by: null, resolved_at: null }).in("id", validTargets);
  } else if (action === "remove_target") {
    for (const report of reportRows) {
      if (report.target_type === "project") await supabaseAdmin.from("projects").delete().eq("id", report.target_id);
      else if (report.target_type === "message") await supabaseAdmin.from("chat_messages").delete().eq("id", report.target_id);
      else if (report.target_type === "user") await supabaseAdmin.from("profiles").update({ is_banned: true, deleted_at: new Date().toISOString() }).eq("id", report.target_id);
    }
    await supabaseAdmin.from("reports").update({ status: "resolved", resolved_by: actor.id, resolved_at: new Date().toISOString() }).in("id", validTargets);
  } else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_report_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { targetCount: validTargets.length, reportIds: validTargets },
    severity: "critical",
  });
  return res.status(200).json({ success: true });
}

async function handleFeatureFlagsList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { data } = await supabaseAdmin
    .from("feature_flags")
    .select("id, name, enabled, description, updated_by, updated_at, created_at")
    .order("name", { ascending: true });
  return res.status(200).json({ rows: data ?? [] });
}

async function handleFeatureFlagsAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;
  const { action, id, name, enabled, description } = (req.body ?? {}) as {
    action?: "toggle" | "update" | "create" | "delete";
    id?: string;
    name?: string;
    enabled?: boolean;
    description?: string | null;
  };
  if (!action) return res.status(400).json({ error: "Missing action" });
  const cleanName = sanitizeText(name, 64).toLowerCase().replace(/\s+/g, "_");
  const cleanDescription = sanitizeText(description, 300);
  if (action === "toggle") {
    if (!id || !isUuid(id) || typeof enabled !== "boolean") return res.status(400).json({ error: "Missing id or enabled" });
    await supabaseAdmin.from("feature_flags").update({ enabled, updated_by: actor.id, updated_at: new Date().toISOString() }).eq("id", id);
  } else if (action === "update") {
    if (!id || !isUuid(id) || !cleanName) return res.status(400).json({ error: "Missing id or name" });
    await supabaseAdmin.from("feature_flags").update({ name: cleanName, description: cleanDescription || null, updated_by: actor.id, updated_at: new Date().toISOString() }).eq("id", id);
  } else if (action === "create") {
    if (!cleanName) return res.status(400).json({ error: "Missing name" });
    await supabaseAdmin.from("feature_flags").insert({ name: cleanName, enabled: Boolean(enabled), description: cleanDescription || null, updated_by: actor.id });
  } else if (action === "delete") {
    if (!id || !isUuid(id)) return res.status(400).json({ error: "Missing id" });
    await supabaseAdmin.from("feature_flags").delete().eq("id", id);
  } else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_feature_flag_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { id: id ?? null, name: name ?? null, enabled: enabled ?? null },
    severity: "warning",
  });
  return res.status(200).json({ success: true });
}

async function handleSettingsList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { data } = await supabaseAdmin.from("settings").select("key, value, updated_by, updated_at, created_at").order("key", { ascending: true });
  return res.status(200).json({ rows: data ?? [] });
}

async function handleSettingsAction(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res, ["super_admin", "admin"]);
  if (!actor) return;
  const { action, key, value } = (req.body ?? {}) as { action?: "upsert" | "delete"; key?: string; value?: unknown };
  const cleanKey = sanitizeText(key, 80).toLowerCase();
  const validKey = /^[a-z0-9._-]+$/.test(cleanKey);
  if (!action || !cleanKey || !validKey) return res.status(400).json({ error: "Missing action or key" });
  if (action === "upsert") {
    await supabaseAdmin.from("settings").upsert({ key: cleanKey, value: safeJsonParse(value), updated_by: actor.id });
  } else if (action === "delete") {
    await supabaseAdmin.from("settings").delete().eq("key", cleanKey);
  } else return res.status(400).json({ error: "Unsupported action" });
  await logSecurityEvent({
    eventType: `admin_setting_${action}`,
    actorId: actor.id,
    ipAddress: getRequestIp(req),
    userAgent: String(req.headers["user-agent"] ?? ""),
    details: { key: cleanKey },
    severity: "critical",
  });
  return res.status(200).json({ success: true });
}

async function handleAnalytics(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const days = Math.max(7, Math.min(180, Number(req.query.days ?? 90)));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const [profilesRes, projectsRes, offersRes, reportsRes, eventsRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, role, plan_type, subscription_status, created_at, last_login_at")
      .is("deleted_at", null),
    supabaseAdmin
      .from("projects")
      .select("id, owner_id, created_at, status")
      .gte("created_at", since.toISOString()),
    supabaseAdmin
      .from("offers")
      .select("id, contractor_id, created_at, status")
      .gte("created_at", since.toISOString()),
    supabaseAdmin
      .from("reports")
      .select("id, status, created_at")
      .gte("created_at", since.toISOString()),
    supabaseAdmin
      .from("security_events")
      .select("id, severity, created_at")
      .gte("created_at", since.toISOString()),
  ]);
  const profiles = profilesRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const offers = offersRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const events = eventsRes.data ?? [];
  const payingUsers = profiles.filter((p) => p.subscription_status === "active" && Boolean(p.plan_type)).length;
  const projectOwners = profiles.filter((p) => p.role === "project_owner").length;
  const contractors = profiles.filter((p) => p.role === "contractor").length;
  const ownersWithProjects = new Set(projects.map((p) => p.owner_id)).size;
  const contractorsWithOffers = new Set(offers.map((o) => o.contractor_id)).size;
  const retentionWindow = new Date();
  retentionWindow.setDate(retentionWindow.getDate() - 30);
  const retentionEligible = profiles.filter((p) => new Date(p.created_at).getTime() < retentionWindow.getTime());
  const retained = retentionEligible.filter((p) =>
    p.last_login_at && new Date(p.last_login_at).getTime() >= retentionWindow.getTime()
  ).length;
  const retentionRate = retentionEligible.length > 0 ? Number(((retained / retentionEligible.length) * 100).toFixed(2)) : 0;
  const warningEvents = events.filter((e) => e.severity === "warning").length;
  const criticalEvents = events.filter((e) => e.severity === "critical").length;
  res.setHeader("Cache-Control", "private, max-age=45");
  return res.status(200).json({
    windowDays: days,
    kpis: {
      projectOwners,
      contractors,
      payingUsers,
      retentionRate30d: retentionRate,
      openReports: reports.filter((r) => r.status === "open").length,
      warningEvents,
      criticalEvents,
    },
    funnel: {
      totalUsers: profiles.length,
      ownersWithProjects,
      contractorsWithOffers,
      payingUsers,
    },
    series: {
      users: countSeries(days, profiles.map((p) => p.created_at).filter((ts) => new Date(ts).getTime() >= since.getTime())),
      projects: countSeries(days, projects.map((p) => p.created_at)),
      offers: countSeries(days, offers.map((o) => o.created_at)),
      reports: countSeries(days, reports.map((r) => r.created_at)),
    },
  });
}

async function handleSecurityEventsList(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const { from, to, page, pageSize } = parsePagination(req);
  const severity = sanitizeText(req.query.severity, 20).toLowerCase();
  const eventType = sanitizeText(req.query.eventType, 80).toLowerCase();
  const q = sanitizeText(req.query.q, 80).toLowerCase();
  let query = supabaseAdmin
    .from("security_events")
    .select("id, event_type, actor_id, target_user_id, ip_address, user_agent, details, severity, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (severity) query = query.eq("severity", severity);
  if (eventType) query = query.ilike("event_type", `%${eventType}%`);
  if (q) query = query.or(`event_type.ilike.%${q}%,ip_address.ilike.%${q}%,user_agent.ilike.%${q}%`);
  const { data, count } = await query;
  const rows = data ?? [];
  const userIds = [...new Set(rows.flatMap((row) => [row.actor_id, row.target_user_id].filter(Boolean) as string[]))];
  const userById = await fetchUserMetaByIds(userIds);
  return res.status(200).json({
    page,
    pageSize,
    total: count ?? 0,
    rows: rows.map((row) => ({
      ...row,
      actorName: row.actor_id ? (userById.get(row.actor_id)?.name ?? "") : "",
      actorEmail: row.actor_id ? (userById.get(row.actor_id)?.email ?? "") : "",
      targetName: row.target_user_id ? (userById.get(row.target_user_id)?.name ?? "") : "",
      targetEmail: row.target_user_id ? (userById.get(row.target_user_id)?.email ?? "") : "",
    })),
  });
}

async function handleHealth(req: VercelRequest, res: VercelResponse) {
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
      sampledCounts: { profiles: profileCount ?? 0, projects: projectCount ?? 0 },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(500).json({
      status: "degraded",
      latencyMs: Date.now() - startedAt,
      checks: { dbConnection: false },
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleAlerts(req: VercelRequest, res: VercelResponse) {
  const actor = await requireAdmin(req, res);
  if (!actor) return;
  const minutes = Math.max(5, Math.min(180, Number(req.query.windowMinutes ?? 60)));
  const criticalThreshold = Math.max(1, Math.min(100, Number(req.query.criticalThreshold ?? 10)));
  const warningThreshold = Math.max(1, Math.min(500, Number(req.query.warningThreshold ?? 30)));
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("security_events")
    .select("severity")
    .gte("created_at", since);
  const rows = data ?? [];
  const criticalCount = rows.filter((row) => row.severity === "critical").length;
  const warningCount = rows.filter((row) => row.severity === "warning").length;
  const alerts: Array<{ level: "warning" | "critical"; title: string; details: string }> = [];
  if (criticalCount >= criticalThreshold) {
    alerts.push({
      level: "critical",
      title: "Critical security spike",
      details: `${criticalCount} critical events in last ${minutes} minutes`,
    });
  }
  if (warningCount >= warningThreshold) {
    alerts.push({
      level: "warning",
      title: "Warning-level anomaly",
      details: `${warningCount} warning events in last ${minutes} minutes`,
    });
  }
  return res.status(200).json({
    windowMinutes: minutes,
    criticalThreshold,
    warningThreshold,
    metrics: { criticalCount, warningCount },
    alerts,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const endpoint = getRoutePath(req);
  try {
    if (req.method === "GET" && endpoint === "overview") return await handleOverview(req, res);
    if (req.method === "GET" && endpoint === "users-list") return await handleUsersList(req, res);
    if (req.method === "POST" && endpoint === "users-action") return await handleUsersAction(req, res);
    if (req.method === "GET" && endpoint === "subscriptions-list") return await handleSimpleList(req, res, "subscriptions");
    if (req.method === "POST" && endpoint === "subscriptions-action") return await handleSubscriptionsAction(req, res);
    if (req.method === "GET" && endpoint === "subscription-promos-list") return await handleSubscriptionPromosList(req, res);
    if (req.method === "POST" && endpoint === "subscription-promos-action") return await handleSubscriptionPromosAction(req, res);
    if (req.method === "GET" && endpoint === "security-state") return await handleSecurityState(req, res);
    if (req.method === "POST" && endpoint === "security-action") return await handleSecurityAction(req, res);
    if (req.method === "GET" && endpoint === "projects-list") return await handleProjectsList(req, res);
    if (req.method === "POST" && endpoint === "projects-action") return await handleProjectsAction(req, res);
    if (req.method === "GET" && endpoint === "offers-list") return await handleOffersList(req, res);
    if (req.method === "POST" && endpoint === "offers-action") return await handleOffersAction(req, res);
    if (req.method === "GET" && endpoint === "conversations-list") return await handleConversationsList(req, res);
    if (req.method === "POST" && endpoint === "conversations-action") return await handleConversationsAction(req, res);
    if (req.method === "GET" && endpoint === "reports-list") return await handleReportsList(req, res);
    if (req.method === "POST" && endpoint === "reports-action") return await handleReportsAction(req, res);
    if (req.method === "GET" && endpoint === "feature-flags-list") return await handleFeatureFlagsList(req, res);
    if (req.method === "POST" && endpoint === "feature-flags-action") return await handleFeatureFlagsAction(req, res);
    if (req.method === "GET" && endpoint === "settings-list") return await handleSettingsList(req, res);
    if (req.method === "POST" && endpoint === "settings-action") return await handleSettingsAction(req, res);
    if (req.method === "GET" && endpoint === "analytics") return await handleAnalytics(req, res);
    if (req.method === "GET" && endpoint === "security-events-list") return await handleSecurityEventsList(req, res);
    if (req.method === "GET" && endpoint === "health") return await handleHealth(req, res);
    if (req.method === "GET" && endpoint === "alerts") return await handleAlerts(req, res);
    return res.status(404).json({ error: "Admin endpoint not found" });
  } catch (error) {
    console.error("Admin catch-all error", endpoint, error);
    const details = getErrorMessage(error);
    return res.status(500).json({ error: `Admin request failed: ${details}` });
  }
}
