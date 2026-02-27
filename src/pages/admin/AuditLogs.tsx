import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "@/lib/csv";

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
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Append-only security events with advanced filters.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading audit logs..." : `${rows.length} events`}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Actor</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.severity}</td>
                  <td className="px-3 py-2">{row.event_type}</td>
                  <td className="px-3 py-2">
                    <p>{row.actorName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.actorEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p>{row.targetName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.targetEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">{row.ip_address || "-"}</td>
                  <td className="px-3 py-2">
                    <pre className="max-w-[460px] whitespace-pre-wrap text-xs text-muted-foreground">
                      {JSON.stringify(row.details ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
