import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface OverviewResponse {
  totals: {
    totalUsers: number;
    activeUsers7d: number;
    totalProjects: number;
    totalOffers: number;
    activeSubscriptions: number;
    mrr: number;
    conversionRate: number;
  };
  series: {
    newUsers30d: { date: string; count: number }[];
  };
}

interface HealthResponse {
  status: "ok" | "degraded";
  latencyMs: number;
}

interface AlertsResponse {
  alerts: Array<{ level: "warning" | "critical"; title: string; details: string }>;
  metrics: { criticalCount: number; warningCount: number };
}

const metricCards: Array<{
  key: keyof OverviewResponse["totals"];
  label: string;
  format?: (value: number) => string;
}> = [
  { key: "totalUsers", label: "Total users" },
  { key: "activeUsers7d", label: "Active users (7d)" },
  { key: "totalProjects", label: "Total projects" },
  { key: "totalOffers", label: "Total offers" },
  { key: "activeSubscriptions", label: "Active subscriptions" },
  { key: "mrr", label: "MRR", format: (value) => `CHF ${value.toLocaleString()}` },
  { key: "conversionRate", label: "Conversion", format: (value) => `${value.toFixed(2)}%` },
];

const AdminOverview = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminFetch<OverviewResponse>(
          "/api/admin/overview",
          getToken,
          undefined,
          { cacheKey: "admin_overview_cache", ttlMs: 30_000 },
        );
        const [healthRes, alertsRes] = await Promise.all([
          adminFetch<HealthResponse>("/api/admin/health", getToken, undefined, { cacheKey: "admin_health_cache", ttlMs: 20_000 }),
          adminFetch<AlertsResponse>("/api/admin/alerts?windowMinutes=60&criticalThreshold=10&warningThreshold=30", getToken, undefined, {
            cacheKey: "admin_alerts_cache",
            ttlMs: 20_000,
          }),
        ]);
        if (!canceled) setData(response);
        if (!canceled) setHealth(healthRes);
        if (!canceled) setAlerts(alertsRes);
      } catch (err) {
        if (!canceled) {
          setError(err instanceof Error ? err.message : "Failed to load admin overview");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    void load();
    return () => {
      canceled = true;
    };
  }, [getToken, refreshNonce]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enterprise-level live platform metrics.</p>
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem("admin_overview_cache");
            sessionStorage.removeItem("admin_health_cache");
            sessionStorage.removeItem("admin_alerts_cache");
            setRefreshNonce((n) => n + 1);
          }}
        >
          Refresh metrics
        </Button>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading overview metrics...</div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {health && (
            <div className={`rounded-xl border p-3 text-sm ${health.status === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
              Admin API health: {health.status.toUpperCase()} ({health.latencyMs}ms)
            </div>
          )}
          {alerts && alerts.alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.alerts.map((alert) => (
                <div
                  key={`${alert.level}-${alert.title}`}
                  className={`rounded-xl border p-3 text-sm ${
                    alert.level === "critical"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-amber-300 bg-amber-50 text-amber-800"
                  }`}
                >
                  <p className="font-semibold">{alert.title}</p>
                  <p>{alert.details}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const raw = data.totals[metric.key] ?? 0;
              return (
                <div key={metric.key} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                    {metric.format ? metric.format(raw) : raw.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-foreground">New users (last 30 days)</h2>
            <p className="mt-1 text-xs text-muted-foreground">Server-calculated growth series.</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series.newUsers30d}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1d4ed8" fillOpacity={0.2} fill="#1d4ed8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminOverview;
