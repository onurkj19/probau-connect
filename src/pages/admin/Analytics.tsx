import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Funnel, retention and behavior trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
        </div>
      </div>

      {loading && <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Loading analytics...</div>}
      {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {!loading && data && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project owners</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.projectOwners}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contractors</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.contractors}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Paying users</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.payingUsers}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Retention 30d</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">{data.kpis.retentionRate30d}%</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Growth trends</h2>
              <p className="text-xs text-muted-foreground">Users, projects and offers per day.</p>
              <div className="mt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series.users.map((u, i) => ({
                    date: u.date,
                    users: u.value,
                    projects: data.series.projects[i]?.value ?? 0,
                    offers: data.series.offers[i]?.value ?? 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line dataKey="users" stroke="#1d4ed8" dot={false} />
                    <Line dataKey="projects" stroke="#059669" dot={false} />
                    <Line dataKey="offers" stroke="#d97706" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1d4ed8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Risk and moderation signals</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Open reports</p>
                <p className="mt-1 text-lg font-semibold">{data.kpis.openReports}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Warning events</p>
                <p className="mt-1 text-lg font-semibold">{data.kpis.warningEvents}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Critical events</p>
                <p className="mt-1 text-lg font-semibold">{data.kpis.criticalEvents}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
