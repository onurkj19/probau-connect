import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "@/lib/csv";

interface ProjectRow {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  service: string;
  deadline: string;
  status: "active" | "closed";
  created_at: string;
  ownerName: string;
  ownerEmail: string;
}

interface ProjectsResponse {
  rows: ProjectRow[];
}

const AdminProjects = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => localStorage.getItem("admin_projects_search") ?? "");
  const [status, setStatus] = useState(() => localStorage.getItem("admin_projects_status") ?? "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const data = await adminFetch<ProjectsResponse>(`/api/admin/projects-list?${params.toString()}`, getToken);
      setRows(data.rows);
      setSelectedIds((prev) => prev.filter((id) => data.rows.some((row) => row.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [getToken, search, status]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    localStorage.setItem("admin_projects_search", search);
    localStorage.setItem("admin_projects_status", status);
  }, [search, status]);

  const runAction = async (action: "close" | "reopen" | "delete", projectId?: string, projectIds?: string[]) => {
    setActiveId(projectId ?? "bulk");
    setError(null);
    try {
      await adminFetch("/api/admin/projects-action", getToken, {
        method: "POST",
        body: JSON.stringify({ projectId, projectIds, action }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Projects Control</h1>
        <p className="mt-1 text-sm text-muted-foreground">Moderate active and closed projects.</p>
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-5">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title/category/service" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <Button onClick={() => void load()}>Refresh</Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "admin-projects.csv",
              ["id", "title", "owner_name", "owner_email", "category", "service", "status", "deadline", "created_at"],
              rows.map((row) => [row.id, row.title, row.ownerName, row.ownerEmail, row.category, row.service, row.status, row.deadline, row.created_at]),
            )
          }
        >
          Export CSV
        </Button>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            await runAction("close", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Close selected ({selectedIds.length})
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            if (!window.confirm(`Delete ${selectedIds.length} selected projects?`)) return;
            await runAction("delete", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Delete selected
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading projects..." : `${rows.length} projects`}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(rows.map((row) => row.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Deadline</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((prev) => [...prev, row.id]);
                        else setSelectedIds((prev) => prev.filter((id) => id !== row.id));
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.service}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p>{row.ownerName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.ownerEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{new Date(row.deadline).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeId === row.id}
                        onClick={() => void runAction(row.status === "active" ? "close" : "reopen", row.id)}
                      >
                        {row.status === "active" ? "Close" : "Reopen"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={activeId === row.id}
                        onClick={() => void runAction("delete", row.id)}
                      >
                        Delete
                      </Button>
                    </div>
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

export default AdminProjects;
