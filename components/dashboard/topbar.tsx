"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/api/auth-client";
import { getRoleLabel } from "@/lib/navigation/role-paths";
import type { SessionUser } from "@/types/auth";

interface TopbarProps {
  user: SessionUser;
  onMenuClick: () => void;
}

export const Topbar = ({ user, onMenuClick }: TopbarProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden text-sm text-neutral-600 md:block">
        Signed in as <span className="font-semibold text-brand-900">{user.company}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-brand-900">{user.name}</p>
          <span className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">
            {getRoleLabel(user.role)}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await logoutUser();
            router.push("/login");
            router.refresh();
          }}
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};
