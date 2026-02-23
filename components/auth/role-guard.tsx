import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getRoleHomePath } from "@/lib/navigation/role-paths";
import type { SessionUser, UserRole } from "@/types/auth";

interface RoleGuardProps {
  user: SessionUser | null;
  allow: UserRole;
  children: ReactNode;
}

export const RoleGuard = ({ user, allow, children }: RoleGuardProps) => {
  if (!user) {
    redirect("/login");
  }

  if (user.role !== allow) {
    redirect(getRoleHomePath(user.role));
  }

  return <>{children}</>;
};
