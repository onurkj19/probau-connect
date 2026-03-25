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
    <div className="app-canvas flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        {impersonationTarget && (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:mx-6">
            <span>Impersonation preview active for user: {impersonationTarget}</span>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-background text-amber-900 hover:bg-amber-100"
              onClick={() => {
                localStorage.removeItem("admin_impersonation_target");
                setImpersonationTarget(null);
              }}
            >
              Exit impersonation
            </Button>
          </div>
        )}
        <div className="surface-glass-chrome sticky top-0 z-20 px-4 py-3 pl-14 md:px-6 md:pl-6">
          <div className="container flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <Bell className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {(user?.email?.[0] ?? "A").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        <div className="app-main">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
