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
      <main className="flex-1 overflow-y-auto">
        {impersonationTarget && (
          <div className="flex items-center justify-between border-b border-amber-500/40 bg-amber-100 px-6 py-2 text-sm text-amber-900">
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
        <div className="border-b border-border bg-card px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-foreground">{user?.email}</p>
        </div>
        <div className="container max-w-7xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
