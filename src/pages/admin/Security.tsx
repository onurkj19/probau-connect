import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SecurityEventRow {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  severity: "info" | "warning" | "critical";
  created_at: string;
}

interface SecurityResponse {
  maintenanceMode: boolean;
  activeSessions: Array<{ userId: string; email?: string; lastSignInAt: string | null }>;
  failedLoginAttempts: number;
  suspiciousActivity: SecurityEventRow[];
  recentEvents: SecurityEventRow[];
}

const AdminSecurity = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState<SecurityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<SecurityResponse>("/api/admin/security-state", getToken);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    body: { action: "force_logout_all" | "force_logout_user" | "maintenance_mode"; targetUserId?: string; enabled?: boolean; message?: string },
  ) => {
    setError(null);
    try {
      await adminFetch("/api/admin/security-action", getToken, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Security action failed");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sessions, security events, and maintenance controls.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Loading security panel...</div>
      )}

      {!loading && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active sessions</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.activeSessions.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Failed login attempts (7d)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.failedLoginAttempts}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Suspicious activity</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.suspiciousActivity.length}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Security actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void runAction({ action: "force_logout_all" })}>
                Force logout all users
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void runAction({
                    action: "maintenance_mode",
                    enabled: !data.maintenanceMode,
                    message: maintenanceMessage || "Maintenance in progress",
                  })
                }
              >
                {data.maintenanceMode ? "Disable maintenance mode" : "Enable maintenance mode"}
              </Button>
              <Input
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Maintenance banner message"
                className="max-w-sm"
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Recent security events</div>
            <div className="max-h-[420px] overflow-y-auto">
              {(data.recentEvents ?? []).map((event) => (
                <div key={event.id} className="border-b border-border px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{event.event_type}</p>
                    <span className="text-xs uppercase text-muted-foreground">{event.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()} • {event.ip_address || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminSecurity;
