import type { ReactNode } from "react";
import { RoleGuard } from "./RoleGuard";

interface AdminRoleGuardProps {
  children: ReactNode;
}

export function AdminRoleGuard({ children }: AdminRoleGuardProps) {
  return (
    <RoleGuard allowedRoles={["super_admin", "admin", "moderator"]}>
      {children}
    </RoleGuard>
  );
}
