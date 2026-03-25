import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAnalyticsSkeleton } from "@/components/common/AdminAnalyticsSkeleton";

interface AnalyticsResponse {
  windowDays: number;
  kpis: {
    projectOwners: number;
    contractors: number;
    payingUsers: number;
    retentionRate30d: number;
    openReports: number;
    warningEvents: number;
    criticalEvents: number;
  };
  funnel: {
    totalUsers: number;
    ownersWithProjects: number;
    contractorsWithOffers: number;
    payingUsers: number;
  };
  series: {
    users: { date: string; value: number }[];
    projects: { date: string; value: number }[];
    offers: { date: string; value: number }[];
    reports: { date: string; value: number }[];
  };
}

const chartTooltip = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--card-foreground))",
};

const AdminAnalytics = () => {
  const { getToken } = useAuth();
  const [days, setDays] = useState(90);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminFetch<AnalyticsResponse>(
          `/api/admin/analytics?days=${days}`,
          getToken,
          undefined,
          { cacheKey: `admin_analytics_${days}`, ttlMs: 45_000 },
        );
        if (!canceled) setData(response);
      } catch (err) {
        if (!canceled) setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    void load();
    return () => {
      canceled = true;
    };
  }, [days, getToken, refreshNonce]);

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        align="end"
        title="Advanced Analytics"
        description="Funnel, retention and behavior trends."
        actions={
          <>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="native-form-control"
            >
              <option value={30}>30d</option>
              <option value={60}>60d</option>
              <option value={90}>90d</option>
              <option value={180}>180d</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem(`admin_analytics_${days}`);
                setRefreshNonce((n) => n + 1);
              }}
            >
              Refresh
            </Button>
          </>
        }
      />

      {loading && <AdminAnalyticsSkeleton />}
      {error && <div className="app-card border-destructive/20 bg-destructive/5 text-sm text-foreground">{error}</div>}

      {!loading && data && (
        <>
          <div className="dashboard-grid-4">
            <div className="surface-panel-compact">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project owners</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.projectOwners}</p>
            </div>
            <div className="surface-panel-compact">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contractors</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.contractors}</p>
            </div>
            <div className="surface-panel-compact">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Paying users</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.payingUsers}</p>
            </div>
            <div className="surface-panel-compact">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Retention 30d</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.retentionRate30d}%</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <section className="surface-panel-compact">
              <h2 className="font-display text-xl font-semibold text-foreground">Growth trends</h2>
              <p className="text-xs text-muted-foreground">Users, projects and offers per day.</p>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.series.users.map((u, i) => ({
                      date: u.date,
                      users: u.value,
                      projects: data.series.projects[i]?.value ?? 0,
                      offers: data.series.offers[i]?.value ?? 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Line dataKey="users" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                    <Line dataKey="projects" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                    <Line dataKey="offers" stroke="hsl(var(--border))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface-panel-compact">
              <h2 className="font-display text-xl font-semibold text-foreground">Acquisition funnel</h2>
              <p className="text-xs text-muted-foreground">User to paying conversion path.</p>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { stage: "Users", value: data.funnel.totalUsers },
                      { stage: "Owners w/ project", value: data.funnel.ownersWithProjects },
                      { stage: "Contractors w/ offer", value: data.funnel.contractorsWithOffers },
                      { stage: "Paying", value: data.funnel.payingUsers },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Bar dataKey="value" fill="hsl(var(--foreground))" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="surface-panel-compact">
            <h2 className="font-display text-xl font-semibold text-foreground">Risk and moderation signals</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-secondary p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Open reports</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{data.kpis.openReports}</p>
              </div>
              <div className="rounded-md border border-border bg-muted p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Warning events</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{data.kpis.warningEvents}</p>
              </div>
              <div className="rounded-md border border-border bg-secondary p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Critical events</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{data.kpis.criticalEvents}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
