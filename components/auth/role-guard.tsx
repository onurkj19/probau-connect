import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { getRoleHomePath } from "@/lib/navigation/role-paths";
import type { SessionUser, UserRole } from "@/types/auth";

interface RoleGuardProps {
  user: SessionUser | null;
  allow: UserRole;
  children: ReactNode;
}

const withLocalePrefix = (locale: string, pathname: string): string => {
  if (pathname === "/") {
    return `/${locale}`;
  }

  return pathname.startsWith(`/${locale}`) ? pathname : `/${locale}${pathname}`;
};

export const RoleGuard = async ({ user, allow, children }: RoleGuardProps) => {
  const locale = await getLocale();

  if (!user) {
    redirect(withLocalePrefix(locale, "/login"));
  }

  if (user.role !== allow) {
    redirect(withLocalePrefix(locale, getRoleHomePath(user.role)));
  }

  return <>{children}</>;
};
