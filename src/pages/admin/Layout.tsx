import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search, Settings } from "lucide-react";

const AdminLayout = () => {
  const { user } = useAuth();
  const [impersonationTarget, setImpersonationTarget] = useState<string | null>(null);

  useEffect(() => {
    setImpersonationTarget(localStorage.getItem("admin_impersonation_target"));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        {impersonationTarget && (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 md:mx-6">
            <span>Impersonation preview active for user: {impersonationTarget}</span>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300/40 bg-amber-500/10 text-amber-50 hover:bg-amber-500/20"
              onClick={() => {
                localStorage.removeItem("admin_impersonation_target");
                setImpersonationTarget(null);
              }}
            >
              Exit impersonation
            </Button>
          </div>
        )}
        <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-4 pl-14 backdrop-blur md:px-6 md:pl-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Signed in as</p>
              <p className="text-sm font-medium text-slate-100">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white">
                <Search className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white">
                <Bell className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white">
                <Settings className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 border border-white/15 bg-slate-900">
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white">
                  {(user?.email?.[0] ?? "A").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        <div className="container max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
