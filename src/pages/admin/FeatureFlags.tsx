import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeletonRows } from "@/components/common/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleLeft } from "lucide-react";

interface FeatureFlagRow {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

const AdminFeatureFlags = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ rows: FeatureFlagRow[] }>("/api/admin/feature-flags-list", getToken);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    payload:
      | { action: "toggle"; id: string; enabled: boolean }
      | { action: "delete"; id: string }
      | { action: "create"; name: string; description: string },
  ) => {
    setActiveId("id" in payload ? payload.id : "new");
    setError(null);
    try {
      await adminFetch("/api/admin/feature-flags-action", getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (payload.action === "create") {
        setNewName("");
        setNewDescription("");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute feature flag action");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="page-title">Feature Flags</h1>
        <p className="page-subtitle">Enable/disable platform capabilities safely.</p>
      </div>

      <div className="app-card grid gap-6 sm:grid-cols-2 xl:grid-cols-[1fr_2fr_auto]">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="flag_name" />
        <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" />
        <Button
          disabled={!newName.trim() || activeId === "new"}
          onClick={() => void runAction({ action: "create", name: newName.trim(), description: newDescription.trim() })}
        >
          Add flag
        </Button>
      </div>

      <div className="app-card-frame">
        <div className="flex min-h-[44px] items-center border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-28 border-0 bg-muted/60" />
          ) : (
            `${rows.length} flags`
          )}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="app-data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Enabled</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={5} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon={ToggleLeft}
                      title="No feature flags"
                      description="Create a flag above to start toggling platform capabilities."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.description || "-"}</td>
                    <td>{row.enabled ? "Yes" : "No"}</td>
                    <td>{new Date(row.updated_at).toLocaleString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={activeId === row.id}
                          onClick={() => void runAction({ action: "toggle", id: row.id, enabled: !row.enabled })}
                        >
                          {row.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={activeId === row.id}
                          onClick={() => void runAction({ action: "delete", id: row.id })}
                        >
                          Delete
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

export default AdminFeatureFlags;
