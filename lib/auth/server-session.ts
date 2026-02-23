import { cookies } from "next/headers";

import { parseSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import type { SessionUser } from "@/types/auth";

export const getServerSessionUser = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return parseSessionCookie(sessionCookie);
};
