import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getServerSessionUser } from "@/lib/auth/server-session";
import { getMenuByRole } from "@/lib/navigation/menu";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const menu = getMenuByRole(user.role);

  return <DashboardShell user={user} menu={menu}>{children}</DashboardShell>;
};

export default DashboardLayout;
