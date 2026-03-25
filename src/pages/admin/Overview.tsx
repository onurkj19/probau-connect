import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPanelCard } from "@/components/admin/AdminPanelCard";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Activity, AlertTriangle, CreditCard, Mail, RefreshCcw, TrendingUp, Users } from "lucide-react";

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

interface HealthDashboardResponse {
  windowHours: number;
  updatedAt: string;
  metrics: {
    newUsers: number;
    activeSubscriptions: number;
    failedPayments: {
      recent: number;
      currentPastDue: number;
    };
    emailDelivery: {
      sent: number;
      failed: number;
      successRate: number;
      status: "healthy" | "degraded" | "down";
    };
  };
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
  const [healthDashboard, setHealthDashboard] = useState<HealthDashboardResponse | null>(null);
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
        const [healthResult, alertsResult, healthDashboardResult] = await Promise.allSettled([
          adminFetch<HealthResponse>("/api/admin/health", getToken, undefined, { cacheKey: "admin_health_cache", ttlMs: 20_000 }),
          adminFetch<AlertsResponse>("/api/admin/alerts?windowMinutes=60&criticalThreshold=10&warningThreshold=30", getToken, undefined, {
            cacheKey: "admin_alerts_cache",
            ttlMs: 20_000,
          }),
          adminFetch<HealthDashboardResponse>("/api/admin/health-dashboard?windowHours=24", getToken, undefined, {
            cacheKey: "admin_health_dashboard_cache",
            ttlMs: 20_000,
          }),
        ]);
        if (!canceled) setData(response);
        if (!canceled) {
          setHealth(healthResult.status === "fulfilled" ? healthResult.value : null);
          setAlerts(alertsResult.status === "fulfilled" ? alertsResult.value : null);
          setHealthDashboard(
            healthDashboardResult.status === "fulfilled" ? healthDashboardResult.value : null,
          );
        }
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Executive Dashboard</p>
          <h1 className="page-title mt-2">Overview</h1>
          <p className="page-subtitle max-w-xl">Enterprise-level live platform metrics.</p>
        </div>
        <Button
          className="gap-2"
          size="sm"
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem("admin_overview_cache");
            sessionStorage.removeItem("admin_health_cache");
            sessionStorage.removeItem("admin_alerts_cache");
            sessionStorage.removeItem("admin_health_dashboard_cache");
            setRefreshNonce((n) => n + 1);
          }}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh metrics
        </Button>
      </div>

      {loading && (
        <div className="app-card text-sm text-muted-foreground">
          Loading overview metrics...
        </div>
      )}
      {error && (
        <div className="app-card border-destructive/20 bg-destructive/5 text-sm text-foreground">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {health && (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border px-6 py-4 text-sm shadow-sm backdrop-blur-sm ${
                health.status === "ok" ? "border-border bg-secondary/95 text-foreground supports-[backdrop-filter]:bg-secondary/90" : "border-border bg-muted/95 text-foreground supports-[backdrop-filter]:bg-muted/90"
              }`}
            >
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Admin API health: {health.status.toUpperCase()} ({health.latencyMs}ms)
              </span>
              <Badge className={health.status === "ok" ? "" : "opacity-80"} variant="secondary">
                {health.status}
              </Badge>
            </div>
          )}
          {alerts && alerts.alerts.length > 0 && (
            <div className="space-y-3">
              {alerts.alerts.map((alert) => (
                <div
                  key={`${alert.level}-${alert.title}`}
                  className="rounded-2xl border border-border bg-secondary/95 p-4 text-sm text-foreground shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-secondary/90"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    {alert.title}
                  </p>
                  <p className="mt-1">{alert.details}</p>
                </div>
              ))}
            </div>
          )}
          <div className="dashboard-grid-4">
            {metricCards.map((metric) => {
              const raw = data.totals[metric.key] ?? 0;
              return (
                <AdminStatCard
                  key={metric.key}
                  label={metric.label}
                  value={metric.format ? metric.format(raw) : raw.toLocaleString()}
                  icon={metric.key === "totalUsers" ? Users : metric.key === "mrr" ? CreditCard : TrendingUp}
                />
              );
            })}
          </div>

          {healthDashboard && (
            <AdminPanelCard
              title="Health Dashboard"
              description={`Live operational metrics (last ${healthDashboard.windowHours}h)`}
            >
              <div className="dashboard-grid-4">
                <AdminStatCard
                  label="New users"
                  value={healthDashboard.metrics.newUsers.toLocaleString()}
                  icon={Users}
                />
                <AdminStatCard
                  label="Active subs"
                  value={healthDashboard.metrics.activeSubscriptions.toLocaleString()}
                  icon={CreditCard}
                />
                <AdminStatCard
                  label="Failed payments"
                  value={healthDashboard.metrics.failedPayments.recent.toLocaleString()}
                  detail={`Past due now: ${healthDashboard.metrics.failedPayments.currentPastDue.toLocaleString()}`}
                  icon={AlertTriangle}
                />
                <AdminStatCard
                  label="Email delivery status"
                  value={`${healthDashboard.metrics.emailDelivery.successRate.toFixed(1)}%`}
                  valueClassName={
                    healthDashboard.metrics.emailDelivery.status === "healthy"
                      ? "text-foreground"
                      : healthDashboard.metrics.emailDelivery.status === "degraded"
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  }
                  detail={`Sent: ${healthDashboard.metrics.emailDelivery.sent} · Failed: ${healthDashboard.metrics.emailDelivery.failed}`}
                  icon={Mail}
                />
              </div>
            </AdminPanelCard>
          )}

          <div className="grid gap-6 lg:gap-8 xl:grid-cols-[1.75fr_1fr]">
            <AdminPanelCard title="New users (last 30 days)" description="Server-calculated growth series.">
              <div className="card-nested h-80 bg-card p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series.newUsers30d}>
                    <defs>
                      <linearGradient id="overviewGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--foreground))"
                      strokeOpacity={0.95}
                      strokeWidth={2}
                      fill="url(#overviewGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AdminPanelCard>
            <AdminPanelCard title="Recent activity" description="Latest daily snapshots for quick scanning.">
              <div className="space-y-3">
                {data.series.newUsers30d.slice(-6).reverse().map((point) => (
                  <div
                    key={point.date}
                    className="card-nested flex items-center justify-between bg-card px-4 py-3"
                  >
                    <p className="text-sm text-muted-foreground">{point.date}</p>
                    <p className="text-sm font-semibold text-foreground">{point.count.toLocaleString()} users</p>
                  </div>
                ))}
              </div>
            </AdminPanelCard>
          </div>

          <AdminPanelCard
            title="Performance snapshot"
            description="High-level status derived from live overview metrics."
            contentClassName="dashboard-grid-4"
          >
            <AdminStatCard label="Conversion" value={`${data.totals.conversionRate.toFixed(2)}%`} icon={TrendingUp} />
            <AdminStatCard
              label="Revenue (MRR)"
              value={`CHF ${data.totals.mrr.toLocaleString()}`}
              icon={CreditCard}
            />
            <AdminStatCard label="Projects" value={data.totals.totalProjects.toLocaleString()} icon={Activity} />
            <AdminStatCard label="Offers" value={data.totals.totalOffers.toLocaleString()} icon={Users} />
          </AdminPanelCard>
        </>
      )}
    </div>
  );
};

export default AdminOverview;
