import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { getServerSessionUser } from "@/lib/auth/server-session";

const ArbeitsgeberLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getServerSessionUser();

  return <RoleGuard user={user} allow="employer">{children}</RoleGuard>;
};

export default ArbeitsgeberLayout;
