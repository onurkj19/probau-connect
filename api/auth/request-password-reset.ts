import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, logSecurityEvent } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

const SUPPORTED_LOCALES = new Set(["de", "fr", "it", "en"]);

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, locale, redirectTo } = (req.body ?? {}) as {
    email?: string;
    locale?: string;
    redirectTo?: string;
  };

  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const normalizedLocale = (locale ?? "").trim().toLowerCase();
  const safeLocale = SUPPORTED_LOCALES.has(normalizedLocale) ? normalizedLocale : "en";
  const safeRedirectTo = typeof redirectTo === "string" ? redirectTo.trim() : "";

  if (!normalizedEmail || !isValidEmail(normalizedEmail) || !safeRedirectTo) {
    // Return a generic response to avoid account enumeration and keep UX predictable.
    return res.status(200).json({ success: true });
  }

  let profileId: string | null = null;
  try {
    // Keep preferred locale in sync so email templates can render proper language.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    profileId = profile?.id ?? null;

    if (profileId) {
      await supabaseAdmin.auth.admin.updateUserById(profileId, {
        user_metadata: {
          preferred_locale: safeLocale,
        },
      });
    }

    await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: safeRedirectTo,
    });

    await logSecurityEvent({
      eventType: "email_reset_requested",
      targetUserId: profileId,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: {
        emailDomain: normalizedEmail.split("@")[1] ?? null,
        locale: safeLocale,
      },
      severity: "info",
    });
  } catch (err) {
    // Intentionally hide internals from client, but keep log for diagnostics.
    console.error("request-password-reset error", err);
    await logSecurityEvent({
      eventType: "email_reset_failed",
      targetUserId: profileId,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: {
        emailDomain: normalizedEmail.split("@")[1] ?? null,
        locale: safeLocale,
      },
      severity: "warning",
    });
  }

  return res.status(200).json({ success: true });
}
