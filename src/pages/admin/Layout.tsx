import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  const { user } = useAuth();
  const [impersonationTarget, setImpersonationTarget] = useState<string | null>(null);

  useEffect(() => {
    setImpersonationTarget(localStorage.getItem("admin_impersonation_target"));
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        {impersonationTarget && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-100 px-4 py-2 pl-14 text-sm text-amber-900 md:px-6 md:pl-6">
            <span>Impersonation preview active for user: {impersonationTarget}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                localStorage.removeItem("admin_impersonation_target");
                setImpersonationTarget(null);
              }}
            >
              Exit impersonation
            </Button>
          </div>
        )}
        <div className="border-b border-border bg-card px-4 py-4 pl-14 md:px-6 md:pl-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-foreground">{user?.email}</p>
        </div>
        <div className="container max-w-7xl px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
