import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { KpiCardsSkeleton } from "@/components/common/KpiCardsSkeleton";
import { TableSkeletonRows } from "@/components/common/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";

interface SubscriptionRow {
  id: string;
  name: string;
  email: string;
  stripeCustomerId: string;
  planType: "basic" | "pro" | null;
  status: "active" | "canceled" | "past_due" | "none";
  renewalDate: string | null;
}

interface SubscriptionResponse {
  rows: SubscriptionRow[];
  summary: {
    totalCustomers: number;
    activeSubscriptions: number;
    mrr: number;
  };
}

const AdminSubscriptions = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<SubscriptionResponse>("/api/admin/subscriptions-list", getToken);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    row: SubscriptionRow,
    action: "force_sync" | "extend" | "revoke",
  ) => {
    setActiveRowId(row.id);
    setError(null);
    try {
      await adminFetch("/api/admin/subscriptions-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action,
          userId: row.id,
          stripeCustomerId: row.stripeCustomerId,
          extraDays: action === "extend" ? 30 : undefined,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run subscription action");
    } finally {
      setActiveRowId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="page-title">Subscriptions</h1>
        <p className="page-subtitle">Stripe-linked customer and revenue controls.</p>
      </div>

      {loading ? (
        <KpiCardsSkeleton count={3} />
      ) : (
        data && (
          <div className="dashboard-grid-3">
            <div className="app-card app-card--interactive">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Stripe customers</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.summary.totalCustomers}</p>
            </div>
            <div className="app-card app-card--interactive">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active subscriptions</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.summary.activeSubscriptions}</p>
            </div>
            <div className="app-card app-card--interactive">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">MRR</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">CHF {data.summary.mrr}</p>
            </div>
          </div>
        )
      )}

      <div className="app-card-frame">
        <div className="flex min-h-[44px] items-center border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-44 border-transparent bg-muted/35" />
          ) : (
            `${data?.rows.length ?? 0} customers`
          )}
        </div>
        {error && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="app-data-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Renewal</th>
                <th>Cancel period end</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={6} />
              ) : (data?.rows.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={CreditCard}
                      title="No subscription customers"
                      description="Stripe-linked accounts will appear here once available."
                    />
                  </td>
                </tr>
              ) : (
                (data?.rows ?? []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-medium">{row.name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </td>
                    <td>{row.planType ?? "-"}</td>
                    <td>{row.status}</td>
                    <td>{row.renewalDate ? new Date(row.renewalDate).toLocaleString() : "-"}</td>
                    <td>{row.status === "canceled" ? "Yes" : "No"}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={activeRowId === row.id} onClick={() => void runAction(row, "force_sync")}>
                          Force sync
                        </Button>
                        <Button size="sm" variant="outline" disabled={activeRowId === row.id} onClick={() => void runAction(row, "extend")}>
                          Extend 30d
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={activeRowId === row.id} onClick={() => void runAction(row, "revoke")}>
                          Revoke
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

export default AdminSubscriptions;
