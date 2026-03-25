import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeletonRows } from "@/components/common/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSignature } from "lucide-react";

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
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="page-title">Offers Control</h1>
        <p className="page-subtitle">Review, accept/reject, or remove offers.</p>
      </div>
      <div className="app-card dashboard-grid-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="native-form-control"
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
      <div className="app-card-frame">
        <div className="flex min-h-[44px] items-center border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-32 border-0 bg-muted/60" />
          ) : (
            `${rows.length} offers`
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
                <th>Project</th>
                <th>Contractor</th>
                <th>Owner</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={8} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={FileSignature}
                      title="No offers"
                      description="Contractor bids on projects will be listed here."
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
                    <td>{row.projectTitle || "-"}</td>
                    <td>
                      <p>{row.contractorName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.contractorEmail || "-"}</p>
                    </td>
                    <td>
                      <p>{row.ownerName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.ownerEmail || "-"}</p>
                    </td>
                    <td>CHF {row.price_chf}</td>
                    <td>{row.status}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOffers;
