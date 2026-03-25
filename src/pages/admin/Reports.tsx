import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeletonRows } from "@/components/common/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag } from "lucide-react";

interface ReportRow {
  id: string;
  target_type: "project" | "user" | "message";
  target_id: string;
  reason: string;
  status: "open" | "resolved";
  reporterName: string;
  reporterEmail: string;
  resolvedByName: string;
  resolved_at: string | null;
  created_at: string;
}

interface ReportsResponse {
  rows: ReportRow[];
}

const AdminReports = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(() => localStorage.getItem("admin_reports_status") ?? "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (status) params.set("status", status);
      const data = await adminFetch<ReportsResponse>(`/api/admin/reports-list?${params.toString()}`, getToken);
      setRows(data.rows);
      setSelectedIds((prev) => prev.filter((id) => data.rows.some((row) => row.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [getToken, status]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    localStorage.setItem("admin_reports_status", status);
  }, [status]);

  const runAction = async (action: "resolve" | "reopen" | "remove_target", reportId?: string, reportIds?: string[]) => {
    setActiveId(reportId ?? "bulk");
    setError(null);
    try {
      await adminFetch("/api/admin/reports-action", getToken, {
        method: "POST",
        body: JSON.stringify({ reportId, reportIds, action }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="page-title">Reports Workflow</h1>
        <p className="page-subtitle">Resolve abuse reports and moderate target entities.</p>
      </div>
      <div className="app-card dashboard-grid-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="native-form-control"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <Button onClick={() => void load()}>Refresh</Button>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            await runAction("resolve", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Resolve selected ({selectedIds.length})
        </Button>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            await runAction("reopen", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Reopen selected
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            if (!window.confirm(`Remove targets for ${selectedIds.length} selected reports and resolve them?`)) return;
            await runAction("remove_target", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Remove targets
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "admin-reports.csv",
              ["id", "target_type", "target_id", "reason", "status", "reporter_name", "reporter_email", "resolved_by", "resolved_at", "created_at"],
              rows.map((row) => [
                row.id,
                row.target_type,
                row.target_id,
                row.reason,
                row.status,
                row.reporterName,
                row.reporterEmail,
                row.resolvedByName,
                row.resolved_at ?? "",
                row.created_at,
              ]),
            )
          }
        >
          Export CSV
        </Button>
      </div>

      <div className="app-card-frame">
        <div className="flex min-h-[44px] items-center border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-36 border-0 bg-muted/60" />
          ) : (
            `${rows.length} reports`
          )}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="app-data-table min-w-[1200px]">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(rows.map((row) => row.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th>Type</th>
                <th>Reason</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={7} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={Flag}
                      title="No reports"
                      description="Moderation reports will show here when users submit them."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds((prev) => [...prev, row.id]);
                          else setSelectedIds((prev) => prev.filter((id) => id !== row.id));
                        }}
                      />
                    </td>
                    <td>
                      <p className="font-medium">{row.target_type}</p>
                      <p className="text-xs text-muted-foreground">{row.target_id}</p>
                    </td>
                    <td>{row.reason}</td>
                    <td>
                      <p>{row.reporterName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.reporterEmail || "-"}</p>
                    </td>
                    <td>{row.status}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={activeId === row.id}
                          onClick={() => void runAction(row.status === "open" ? "resolve" : "reopen", row.id)}
                        >
                          {row.status === "open" ? "Resolve" : "Reopen"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={activeId === row.id}
                          onClick={() => void runAction("remove_target", row.id)}
                        >
                          Remove target + resolve
                        </Button>
                      </div>
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

export default AdminReports;
