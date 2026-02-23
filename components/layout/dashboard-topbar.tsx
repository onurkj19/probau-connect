"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { logoutUser } from "@/lib/api/auth-client";
import type { SessionUser } from "@/types/auth";

import { Button } from "@/components/ui/button";

export const DashboardTopbar = ({ user, onOpenSidebar }: { user: SessionUser; onOpenSidebar: () => void }) => {
  const router = useRouter();

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 md:hidden"
      >
        Menu
      </button>

      <div className="hidden text-sm text-neutral-600 md:block">
        Signed in as <span className="font-semibold text-brand-900">{user.company}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <p className="font-semibold text-brand-900">{user.name}</p>
          <p className="text-neutral-500">{user.role === "employer" ? "Arbeitsgeber" : "Unternehmer"}</p>
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
