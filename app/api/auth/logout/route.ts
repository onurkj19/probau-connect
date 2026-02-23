import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export const POST = async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0),
  });
  return response;
};
