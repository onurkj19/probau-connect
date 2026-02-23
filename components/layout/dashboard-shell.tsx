"use client";

import { useState, type ReactNode } from "react";

import type { NavItem } from "@/lib/navigation/menu";
import type { SessionUser } from "@/types/auth";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

interface DashboardShellProps {
  user: SessionUser;
  menu: NavItem[];
  children: ReactNode;
}

export const DashboardShell = ({ user, menu, children }: DashboardShellProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar
        items={menu}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col md:ml-0">
        <DashboardTopbar user={user} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
