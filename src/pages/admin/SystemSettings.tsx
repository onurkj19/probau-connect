import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

const AdminSystemSettings = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [editorValue, setEditorValue] = useState<string>("{}");
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => rows.find((r) => r.key === selectedKey) ?? null, [rows, selectedKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ rows: SettingRow[] }>("/api/admin/settings-list", getToken);
      setRows(data.rows);
      if (data.rows.length > 0) {
        const firstKey = selectedKey && data.rows.some((r) => r.key === selectedKey) ? selectedKey : data.rows[0].key;
        setSelectedKey(firstKey);
        const first = data.rows.find((r) => r.key === firstKey);
        setEditorValue(JSON.stringify(first?.value ?? {}, null, 2));
      } else {
        setSelectedKey("");
        setEditorValue("{}");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selected) setEditorValue(JSON.stringify(selected.value ?? {}, null, 2));
  }, [selected]);

  const saveSetting = async (key: string, rawValue: string) => {
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(rawValue) as Record<string, unknown>;
      await adminFetch("/api/admin/settings-action", getToken, {
        method: "POST",
        body: JSON.stringify({ action: "upsert", key, value: parsed }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    setSaving(true);
    setError(null);
    try {
      await adminFetch("/api/admin/settings-action", getToken, {
        method: "POST",
        body: JSON.stringify({ action: "delete", key }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage runtime JSON configuration centrally.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="new_setting_key" />
        <Input value="{}" disabled />
        <Button
          disabled={!newKey.trim() || saving}
          onClick={() => {
            void saveSetting(newKey.trim(), "{}");
            setNewKey("");
          }}
        >
          Add setting
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
            {loading ? "Loading settings..." : `${rows.length} settings`}
          </div>
          <div className="max-h-[480px] overflow-y-auto p-2">
            {rows.map((row) => (
              <button
                type="button"
                key={row.key}
                onClick={() => setSelectedKey(row.key)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedKey === row.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {row.key}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border border-border bg-card p-4">
          {error && <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          {!selected && !loading && (
            <p className="text-sm text-muted-foreground">Select a setting key to edit.</p>
          )}
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">{selected.key}</h2>
                  <p className="text-xs text-muted-foreground">Updated {new Date(selected.updated_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => void saveSetting(selected.key, editorValue)}>
                    Save JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={saving}
                    onClick={() => void deleteSetting(selected.key)}
                  >
                    Delete key
                  </Button>
                </div>
              </div>
              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                className="min-h-[360px] w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
                spellCheck={false}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminSystemSettings;
