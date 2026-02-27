import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stripe-linked customer and revenue controls.</p>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Stripe customers</p>
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.summary.totalCustomers}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active subscriptions</p>
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.summary.activeSubscriptions}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">MRR</p>
            <p className="mt-2 font-display text-2xl font-semibold text-foreground">CHF {data.summary.mrr}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading subscriptions..." : `${data?.rows.length ?? 0} customers`}
        </div>
        {error && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Renewal</th>
                <th className="px-3 py-2 font-medium">Cancel period end</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && data?.rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.name || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-3 py-2">{row.planType ?? "-"}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.renewalDate ? new Date(row.renewalDate).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2">{row.status === "canceled" ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
