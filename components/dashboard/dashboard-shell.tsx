"use client";

import { useState, type ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { NavItem } from "@/lib/navigation/menu";
import type { SessionUser } from "@/types/auth";

interface DashboardShellProps {
  user: SessionUser;
  menuItems: NavItem[];
  children: ReactNode;
}

export const DashboardShell = ({ user, menuItems, children }: DashboardShellProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar items={menuItems} isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col md:pl-72">
        <Topbar user={user} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
