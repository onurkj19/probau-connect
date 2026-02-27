import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth, type UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "@/lib/csv";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  planType: "basic" | "pro" | null;
  subscriptionStatus: "active" | "canceled" | "past_due" | "none";
  isVerified: boolean;
  isBanned: boolean;
  projectsCount: number;
  offersCount: number;
  lastLoginAt: string | null;
  deletedAt: string | null;
}

interface UsersResponse {
  page: number;
  pageSize: number;
  total: number;
  rows: AdminUserRow[];
}

type UserActionPayload = {
  action:
    | "ban"
    | "unban"
    | "verify"
    | "unverify"
    | "change_role"
    | "set_subscription"
    | "soft_delete"
    | "impersonate";
  userId?: string;
  userIds?: string[];
  role?: UserRole;
  planType?: "basic" | "pro" | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
};

const roleOptions: UserRole[] = ["super_admin", "admin", "moderator", "project_owner", "contractor"];

const AdminUsers = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState(() => localStorage.getItem("admin_users_search") ?? "");
  const [roleFilter, setRoleFilter] = useState(() => localStorage.getItem("admin_users_role") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem("admin_users_status") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, UserRole>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50",
      });
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const response = await adminFetch<UsersResponse>(`/api/admin/users-list?${params.toString()}`, getToken);
      setRows(response.rows);
      setSelectedIds((prev) => prev.filter((id) => response.rows.some((row) => row.id === id)));
      setRoleDraft(response.rows.reduce<Record<string, UserRole>>((acc, row) => {
        acc[row.id] = row.role;
        return acc;
      }, {}));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [getToken, roleFilter, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    localStorage.setItem("admin_users_search", search);
    localStorage.setItem("admin_users_role", roleFilter);
    localStorage.setItem("admin_users_status", statusFilter);
  }, [roleFilter, search, statusFilter]);

  const runAction = async (payload: UserActionPayload & { userIds?: string[] }) => {
    setActiveActionId(payload.userId ?? "bulk");
    setError(null);
    try {
      await adminFetch<{ success: boolean }>("/api/admin/users-action", getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await load();
      if (payload.action === "impersonate") {
        localStorage.setItem("admin_impersonation_target", payload.userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action");
    } finally {
      setActiveActionId(null);
    }
  };

  const totalRows = useMemo(() => rows.length, [rows.length]);
  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Role, moderation, subscription and lifecycle control.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, company"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="deleted">Soft deleted</option>
        </select>
        <Button onClick={() => void load()}>Refresh</Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "admin-users.csv",
              ["id", "name", "email", "role", "plan", "subscription_status", "is_verified", "is_banned", "projects_count", "offers_count", "last_login_at"],
              rows.map((row) => [
                row.id,
                row.name,
                row.email,
                row.role,
                row.planType ?? "",
                row.subscriptionStatus,
                row.isVerified,
                row.isBanned,
                row.projectsCount,
                row.offersCount,
                row.lastLoginAt ?? "",
              ]),
            )
          }
        >
          Export CSV
        </Button>
        <Button
          variant="outline"
          disabled={selectedCount === 0}
          onClick={async () => {
            await runAction({ action: "ban", userIds: selectedIds, userId: selectedIds[0] });
            setSelectedIds([]);
          }}
        >
          Ban selected ({selectedCount})
        </Button>
        <Button
          variant="outline"
          disabled={selectedCount === 0}
          onClick={async () => {
            await runAction({ action: "unban", userIds: selectedIds, userId: selectedIds[0] });
            setSelectedIds([]);
          }}
        >
          Unban selected
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading users..." : `${totalRows} users`}
        </div>
        {error && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(rows.map((row) => row.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Verified</th>
                <th className="px-3 py-2 font-medium">Banned</th>
                <th className="px-3 py-2 font-medium">Projects</th>
                <th className="px-3 py-2 font-medium">Offers</th>
                <th className="px-3 py-2 font-medium">Last login</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, row.id]);
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== row.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">{row.name || "-"}</td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={roleDraft[row.id] ?? row.role}
                        onChange={(e) => setRoleDraft((prev) => ({ ...prev, [row.id]: e.target.value as UserRole }))}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeActionId === row.id}
                        onClick={() => {
                          void runAction({ action: "change_role", userId: row.id, role: roleDraft[row.id] ?? row.role });
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.planType ? `${row.planType} (${row.subscriptionStatus})` : row.subscriptionStatus}</td>
                  <td className="px-3 py-2">{row.isVerified ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{row.isBanned ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{row.projectsCount}</td>
                  <td className="px-3 py-2">{row.offersCount}</td>
                  <td className="px-3 py-2">{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeActionId === row.id}
                        onClick={() => void runAction({ action: row.isVerified ? "unverify" : "verify", userId: row.id })}
                      >
                        {row.isVerified ? "Unverify" : "Verify"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeActionId === row.id}
                        onClick={() => void runAction({ action: row.isBanned ? "unban" : "ban", userId: row.id })}
                      >
                        {row.isBanned ? "Unban" : "Ban"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeActionId === row.id}
                        onClick={() =>
                          void runAction({
                            action: "set_subscription",
                            userId: row.id,
                            planType: row.planType === "pro" ? "basic" : "pro",
                            subscriptionStatus: "active",
                          })
                        }
                      >
                        {row.planType === "pro" ? "Downgrade" : "Upgrade"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={activeActionId === row.id || Boolean(row.deletedAt)}
                        onClick={() => void runAction({ action: "soft_delete", userId: row.id })}
                      >
                        Soft delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeActionId === row.id}
                        onClick={() => void runAction({ action: "impersonate", userId: row.id })}
                      >
                        Impersonate
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

export default AdminUsers;
