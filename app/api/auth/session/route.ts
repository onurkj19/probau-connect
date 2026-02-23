import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { parseSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export const GET = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(sessionCookie);

  return NextResponse.json({
    ok: true,
    session,
  });
};
