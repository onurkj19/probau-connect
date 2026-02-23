import type { SessionUser } from "@/types/auth";

export const SESSION_COOKIE_NAME = "probau_session";

export const serializeSessionCookie = (session: SessionUser): string =>
  encodeURIComponent(JSON.stringify(session));

export const parseSessionCookie = (rawValue?: string): SessionUser | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as SessionUser;

    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      (parsed.role === "employer" || parsed.role === "contractor")
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};
