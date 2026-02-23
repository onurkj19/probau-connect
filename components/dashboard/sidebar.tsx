"use client";

import {
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  Settings,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation/menu";

interface SidebarProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ items, isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const iconMap = {
    dashboard: LayoutDashboard,
    create: ClipboardList,
    projects: FolderOpen,
    offers: ListChecks,
    subscription: WalletCards,
    settings: Settings,
  } as const;

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-brand-950/30 md:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-neutral-200 bg-white transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-neutral-200 px-5 py-5">
          <Link href="/" className="text-lg font-bold text-brand-900">
            ProBau<span className="text-swiss-red">.ch</span>
          </Link>
          <p className="mt-1 text-xs text-neutral-500">Swiss Construction SaaS</p>
        </div>

        <nav className="space-y-1.5 px-3 py-4">
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-900 text-white"
                    : "text-neutral-700 hover:bg-brand-100 hover:text-brand-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
