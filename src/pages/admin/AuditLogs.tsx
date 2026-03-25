import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "@/lib/csv";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeletonRows } from "@/components/common/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";

interface AuditRow {
  id: string;
  event_type: string;
  actor_id: string | null;
  actorName: string;
  actorEmail: string;
  target_user_id: string | null;
  targetName: string;
  targetEmail: string;
  ip_address: string | null;
  user_agent: string | null;
  severity: "info" | "warning" | "critical";
  details: Record<string, unknown>;
  created_at: string;
}

interface AuditResponse {
  rows: AuditRow[];
}

const AdminAuditLogs = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState(() => localStorage.getItem("admin_audit_severity") ?? "");
  const [eventType, setEventType] = useState(() => localStorage.getItem("admin_audit_eventType") ?? "");
  const [q, setQ] = useState(() => localStorage.getItem("admin_audit_q") ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      if (severity) params.set("severity", severity);
      if (eventType.trim()) params.set("eventType", eventType.trim());
      if (q.trim()) params.set("q", q.trim());
      const data = await adminFetch<AuditResponse>(`/api/admin/security-events-list?${params.toString()}`, getToken);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [eventType, getToken, q, severity]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    localStorage.setItem("admin_audit_severity", severity);
    localStorage.setItem("admin_audit_eventType", eventType);
    localStorage.setItem("admin_audit_q", q);
  }, [eventType, q, severity]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Append-only security events with advanced filters.</p>
      </div>

      <div className="app-card grid sm:grid-cols-2 xl:grid-cols-4">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="native-form-control"
        >
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Event type contains..." />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IP/User-Agent/Event..." />
        <div className="flex gap-2">
          <Button onClick={() => void load()}>Refresh</Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "admin-audit-logs.csv",
                ["timestamp", "severity", "event_type", "actor", "target", "ip_address", "details"],
                rows.map((row) => [
                  row.created_at,
                  row.severity,
                  row.event_type,
                  row.actorEmail || row.actorName || "",
                  row.targetEmail || row.targetName || "",
                  row.ip_address || "",
                  JSON.stringify(row.details ?? {}),
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="app-card-frame">
        <div className="flex min-h-[44px] items-center border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-40 border-0 bg-muted/60" />
          ) : (
            `${rows.length} events`
          )}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="app-data-table min-w-[1400px]">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Event</th>
                <th>Actor</th>
                <th>Target</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={7} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={ScrollText}
                      title="No audit events"
                      description="Try adjusting filters or refresh to load the latest security log."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>{row.severity}</td>
                    <td>{row.event_type}</td>
                    <td>
                      <p>{row.actorName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.actorEmail || "-"}</p>
                    </td>
                    <td>
                      <p>{row.targetName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.targetEmail || "-"}</p>
                    </td>
                    <td>{row.ip_address || "-"}</td>
                    <td>
                      <pre className="max-w-[460px] whitespace-pre-wrap text-xs text-muted-foreground">
                        {JSON.stringify(row.details ?? {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
