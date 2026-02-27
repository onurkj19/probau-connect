import { type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth, type UserRole } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/${lang}/login`} replace />;
  }

  if (user.isBanned || user.deletedAt) {
    return <Navigate to={`/${lang}/banned`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${lang}/unauthorized`} replace />;
  }

  return <>{children}</>;
}
