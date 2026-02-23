import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import type { SessionUser } from "@/types/auth";

interface ProtectedRouteProps {
  user: SessionUser | null;
  redirectTo?: string;
  children: ReactNode;
}

const withLocalePrefix = (locale: string, pathname: string): string => {
  if (pathname === "/") {
    return `/${locale}`;
  }

  return pathname.startsWith(`/${locale}`) ? pathname : `/${locale}${pathname}`;
};

export const ProtectedRoute = async ({
  user,
  redirectTo = "/login",
  children,
}: ProtectedRouteProps) => {
  if (!user) {
    const locale = await getLocale();
    redirect(withLocalePrefix(locale, redirectTo));
  }

  return <>{children}</>;
};
