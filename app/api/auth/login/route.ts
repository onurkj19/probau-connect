import { NextResponse } from "next/server";
import { z } from "zod";

import { createSessionFromPayload } from "@/lib/auth/create-session";
import { serializeSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employer", "contractor"]),
  company: z.string().min(2),
  name: z.string().min(2),
  isSubscribed: z.boolean().optional(),
  plan: z.enum(["basic", "pro"]).optional(),
});

export const POST = async (request: Request) => {
  try {
    const payload = loginSchema.parse(await request.json());
    const session = createSessionFromPayload(payload);

    const response = NextResponse.json({
      ok: true,
      session,
    });

    response.cookies.set(SESSION_COOKIE_NAME, serializeSessionCookie(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid login payload.",
      },
      { status: 400 },
    );
  }
};
