import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRoleHomePath } from "@/lib/navigation/role-paths";
import { parseSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

const publicPaths = new Set(["/", "/pricing", "/login", "/register", "/impressum", "/privacy", "/agb"]);

const isPublicPath = (pathname: string): boolean => {
  if (publicPaths.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/api/auth");
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/placeholder.svg") ||
    pathname.startsWith("/robots.txt")
  ) {
    return NextResponse.next();
  }

  const session = parseSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isPublicPath(pathname)) {
    if (session && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/arbeitsgeber") ||
    pathname.startsWith("/unternehmer") ||
    pathname.startsWith("/dashboard")
  ) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
    }

    if (pathname.startsWith("/arbeitsgeber") && session.role !== "employer") {
      return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
    }

    if (pathname.startsWith("/unternehmer") && session.role !== "contractor") {
      return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
