"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation/menu";

interface DashboardSidebarProps {
  items: NavItem[];
  mobileOpen: boolean;
  onClose: () => void;
}

export const DashboardSidebar = ({ items, mobileOpen, onClose }: DashboardSidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-brand-950/35 md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-72 border-r border-neutral-200 bg-white p-5 transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <Link href="/dashboard" className="block text-xl font-bold text-brand-900">
          ProBau<span className="text-swiss-red">.ch</span>
        </Link>
        <p className="mt-1 text-xs text-neutral-500">Swiss Construction Marketplace</p>

        <nav className="mt-8 space-y-1.5">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-900 text-white"
                    : "text-neutral-700 hover:bg-brand-100 hover:text-brand-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
