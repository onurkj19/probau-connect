import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";

interface OfferRow {
  id: string;
  project_id: string;
  projectTitle: string;
  contractorName: string;
  contractorEmail: string;
  ownerName: string;
  ownerEmail: string;
  price_chf: number;
  status: "submitted" | "accepted" | "rejected";
  created_at: string;
}

interface OffersResponse {
  rows: OfferRow[];
}

const AdminOffers = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(() => localStorage.getItem("admin_offers_status") ?? "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (status) params.set("status", status);
      const data = await adminFetch<OffersResponse>(`/api/admin/offers-list?${params.toString()}`, getToken);
      setRows(data.rows);
      setSelectedIds((prev) => prev.filter((id) => data.rows.some((row) => row.id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, [getToken, status]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    localStorage.setItem("admin_offers_status", status);
  }, [status]);

  const runAction = async (action: "accept" | "reject" | "delete", offerId?: string, offerIds?: string[]) => {
    setActiveId(offerId ?? "bulk");
    setError(null);
    try {
      await adminFetch("/api/admin/offers-action", getToken, {
        method: "POST",
        body: JSON.stringify({ offerId, offerIds, action }),
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
        <h1 className="font-display text-3xl font-bold text-foreground">Offers Control</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review, accept/reject, or remove offers.</p>
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button onClick={() => void load()}>Refresh</Button>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            await runAction("accept", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Accept selected ({selectedIds.length})
        </Button>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            await runAction("reject", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Reject selected
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={selectedIds.length === 0}
          onClick={async () => {
            if (!window.confirm(`Delete ${selectedIds.length} selected offers?`)) return;
            await runAction("delete", selectedIds[0], selectedIds);
            setSelectedIds([]);
          }}
        >
          Delete selected
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "admin-offers.csv",
              ["id", "project_title", "contractor_name", "contractor_email", "owner_name", "owner_email", "price_chf", "status", "created_at"],
              rows.map((row) => [
                row.id,
                row.projectTitle,
                row.contractorName,
                row.contractorEmail,
                row.ownerName,
                row.ownerEmail,
                row.price_chf,
                row.status,
                row.created_at,
              ]),
            )
          }
        >
          Export CSV
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading offers..." : `${rows.length} offers`}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
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
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Contractor</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
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
                  <td className="px-3 py-2">{row.projectTitle || "-"}</td>
                  <td className="px-3 py-2">
                    <p>{row.contractorName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.contractorEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p>{row.ownerName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.ownerEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">CHF {row.price_chf}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={activeId === row.id} onClick={() => void runAction("accept", row.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" disabled={activeId === row.id} onClick={() => void runAction("reject", row.id)}>
                        Reject
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

export default AdminOffers;
