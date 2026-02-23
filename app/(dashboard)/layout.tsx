import type { ReactNode } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getMenuByRole } from "@/lib/navigation/menu";

const AuthenticatedLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getServerSessionUser();
  const menuItems = user ? getMenuByRole(user.role) : [];

  return (
    <ProtectedRoute user={user}>
      {user ? (
        <DashboardShell user={user} menuItems={menuItems}>
          {children}
        </DashboardShell>
      ) : null}
    </ProtectedRoute>
  );
};

export default AuthenticatedLayout;
