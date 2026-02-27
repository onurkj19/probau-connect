import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Feature Flags</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enable/disable platform capabilities safely.</p>
      </div>

      <div className="grid gap-2 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_2fr_auto]">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="flag_name" />
        <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" />
        <Button
          disabled={!newName.trim() || activeId === "new"}
          onClick={() => void runAction({ action: "create", name: newName.trim(), description: newDescription.trim() })}
        >
          Add flag
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading flags..." : `${rows.length} flags`}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Enabled</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.description || "-"}</td>
                  <td className="px-3 py-2">{row.enabled ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{new Date(row.updated_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureFlags;
