import type { AuthPayload, SessionUser } from "@/types/auth";

export const createSessionFromPayload = (payload: AuthPayload): SessionUser => {
  const normalizedRole = payload.role === "contractor" ? "contractor" : "employer";
  const isSubscribed = normalizedRole === "contractor" ? Boolean(payload.isSubscribed) : false;
  const plan = isSubscribed ? payload.plan ?? "basic" : null;

  return {
    id: normalizedRole === "employer" ? "employer-01" : "contractor-01",
    name: payload.name,
    email: payload.email,
    company: payload.company,
    role: normalizedRole,
    isSubscribed,
    plan,
  };
};
