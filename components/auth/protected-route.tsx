import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import type { SessionUser } from "@/types/auth";

interface ProtectedRouteProps {
  user: SessionUser | null;
  redirectTo?: string;
  children: ReactNode;
}

export const ProtectedRoute = ({
  user,
  redirectTo = "/login",
  children,
}: ProtectedRouteProps) => {
  if (!user) {
    redirect(redirectTo);
  }

  return <>{children}</>;
};
