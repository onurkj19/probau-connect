import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRoleHomePath } from "@/lib/navigation/role-paths";
import { parseSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { routing } from "@/i18n/routing";

const publicPaths = new Set(["/", "/pricing", "/login", "/register", "/impressum", "/privacy", "/agb"]);

const isPublicPath = (pathname: string): boolean => {
  if (publicPaths.has(pathname)) {
    return true;
  }

  return false;
};

const isLocaleSegment = (segment: string): boolean =>
  routing.locales.includes(segment as (typeof routing.locales)[number]);

const withLocale = (locale: string, pathname: string): string => {
  if (pathname === "/") {
    return `/${locale}`;
  }

  return pathname.startsWith(`/${locale}`) ? pathname : `/${locale}${pathname}`;
};

const getLocalePathname = (pathname: string): { locale: string | null; pathnameWithoutLocale: string } => {
  const segments = pathname.split("/");
  const locale = segments[1];

  if (!locale || !isLocaleSegment(locale)) {
    return {
      locale: null,
      pathnameWithoutLocale: pathname,
    };
  }

  const rest = segments.slice(2).join("/");
  return {
    locale,
    pathnameWithoutLocale: rest ? `/${rest}` : "/",
  };
};

export const middleware = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/placeholder.svg") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const { locale, pathnameWithoutLocale } = getLocalePathname(pathname);
  if (!locale) {
    const redirectPath = withLocale(routing.defaultLocale, pathname);
    return NextResponse.redirect(new URL(`${redirectPath}${search}`, request.url));
  }

  const session = parseSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isPublicPath(pathnameWithoutLocale)) {
    if (session && (pathnameWithoutLocale === "/login" || pathnameWithoutLocale === "/register")) {
      return NextResponse.redirect(new URL(withLocale(locale, getRoleHomePath(session.role)), request.url));
    }
    return NextResponse.next();
  }

  if (
    pathnameWithoutLocale.startsWith("/arbeitsgeber") ||
    pathnameWithoutLocale.startsWith("/unternehmer") ||
    pathnameWithoutLocale.startsWith("/dashboard")
  ) {
    if (!session) {
      const loginUrl = new URL(withLocale(locale, "/login"), request.url);
      loginUrl.searchParams.set("redirect", pathnameWithoutLocale);
      return NextResponse.redirect(loginUrl);
    }

    if (pathnameWithoutLocale.startsWith("/dashboard")) {
      return NextResponse.redirect(
        new URL(withLocale(locale, getRoleHomePath(session.role)), request.url),
      );
    }

    if (pathnameWithoutLocale.startsWith("/arbeitsgeber") && session.role !== "employer") {
      return NextResponse.redirect(
        new URL(withLocale(locale, getRoleHomePath(session.role)), request.url),
      );
    }

    if (pathnameWithoutLocale.startsWith("/unternehmer") && session.role !== "contractor") {
      return NextResponse.redirect(
        new URL(withLocale(locale, getRoleHomePath(session.role)), request.url),
      );
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
