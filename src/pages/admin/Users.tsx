import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth, type UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "@/lib/csv";
import { Check, Loader2, MoreHorizontal, Trash2 } from "lucide-react";

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
    | "hard_delete"
    | "impersonate";
  userId?: string;
  userIds?: string[];
  role?: UserRole;
  planType?: "basic" | "pro" | null;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
};
type UserActionType = UserActionPayload["action"];

const roleOptions: UserRole[] = ["super_admin", "admin", "moderator", "project_owner", "contractor"];

const AdminUsers = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState(() => localStorage.getItem("admin_users_search") ?? "");
  const [roleFilter, setRoleFilter] = useState(() => localStorage.getItem("admin_users_role") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem("admin_users_status") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ id: string; action: UserActionType } | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, UserRole>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionSuccess, setActionSuccess] = useState<Record<string, number>>({});

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
    setActiveAction({ id: payload.userId ?? "bulk", action: payload.action });
    setError(null);
    try {
      await adminFetch<{ success: boolean }>("/api/admin/users-action", getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const key = payload.userId ? `${payload.userId}:${payload.action}` : null;
      if (key) {
        setActionSuccess((prev) => ({ ...prev, [key]: Date.now() }));
        setTimeout(() => {
          setActionSuccess((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }, 1600);
      }
      await load();
      if (payload.action === "impersonate") {
        localStorage.setItem("admin_impersonation_target", payload.userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute action");
    } finally {
      setActiveAction(null);
    }
  };

  const totalRows = useMemo(() => rows.length, [rows.length]);
  const selectedCount = selectedIds.length;
  const statusPillClass = (isPositive: boolean) =>
    `inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
      isPositive
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
        : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
    }`;
  const isActionRunning = (userId: string, action: UserActionType) =>
    activeAction?.id === userId && activeAction.action === action;
  const isActionDone = (userId: string, action: UserActionType) =>
    Boolean(actionSuccess[`${userId}:${action}`]);
  const isRowBusy = (userId: string) => activeAction?.id === userId;

  const actionContent = (
    userId: string,
    action: UserActionType,
    idleLabel: string,
    doneLabel = "Done",
    doneIcon: "check" | "trash" = "check",
  ) => {
    if (isActionRunning(userId, action)) {
      return (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Working...
        </>
      );
    }
    if (isActionDone(userId, action)) {
      return (
        <>
          {doneIcon === "trash" ? <Trash2 className="h-3.5 w-3.5 animate-bounce" /> : <Check className="h-3.5 w-3.5 animate-bounce" />}
          {doneLabel}
        </>
      );
    }
    return idleLabel;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Role, moderation, subscription and lifecycle control.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, email, name, company"
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
        <Button
          variant="destructive"
          disabled={selectedCount === 0}
          onClick={async () => {
            const confirmed = window.confirm(
              `This will permanently delete ${selectedCount} selected users and all related records. Continue?`,
            );
            if (!confirmed) return;
            await runAction({ action: "hard_delete", userIds: selectedIds, userId: selectedIds[0] });
            setSelectedIds([]);
          }}
        >
          Delete permanently selected ({selectedCount})
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
                <th className="px-3 py-2 font-medium">User ID</th>
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
                (() => {
                  const isSuperAdmin = row.role === "super_admin";
                  return (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      disabled={isSuperAdmin}
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
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                  </td>
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={roleDraft[row.id] ?? row.role}
                        onChange={(e) => setRoleDraft((prev) => ({ ...prev, [row.id]: e.target.value as UserRole }))}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        disabled={isSuperAdmin}
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
                        disabled={activeAction?.id === row.id || isSuperAdmin}
                        onClick={() => {
                          void runAction({ action: "change_role", userId: row.id, role: roleDraft[row.id] ?? row.role });
                        }}
                      >
                        {isSuperAdmin ? "Locked" : actionContent(row.id, "change_role", "Apply", "Saved")}
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.planType ? `${row.planType} (${row.subscriptionStatus})` : row.subscriptionStatus}</td>
                  <td className="px-3 py-2">
                    <span className={statusPillClass(row.isVerified)}>
                      {row.isVerified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={statusPillClass(!row.isBanned)}>
                      {row.isBanned ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.projectsCount}</td>
                  <td className="px-3 py-2">{row.offersCount}</td>
                  <td className="px-3 py-2">{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8" disabled={isSuperAdmin}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>User actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isRowBusy(row.id) || isSuperAdmin}
                          onSelect={(event) => {
                            event.preventDefault();
                            void runAction({ action: row.isVerified ? "unverify" : "verify", userId: row.id });
                          }}
                        >
                          {actionContent(row.id, row.isVerified ? "unverify" : "verify", row.isVerified ? "Unverify" : "Verify", "Updated")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isRowBusy(row.id) || isSuperAdmin}
                          onSelect={(event) => {
                            event.preventDefault();
                            void runAction({ action: row.isBanned ? "unban" : "ban", userId: row.id });
                          }}
                        >
                          {actionContent(row.id, row.isBanned ? "unban" : "ban", row.isBanned ? "Unban" : "Ban", "Applied")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isRowBusy(row.id) || isSuperAdmin}
                          onSelect={(event) => {
                            event.preventDefault();
                            void runAction({
                              action: "set_subscription",
                              userId: row.id,
                              planType: row.planType === "pro" ? "basic" : "pro",
                              subscriptionStatus: "active",
                            });
                          }}
                        >
                          {actionContent(row.id, "set_subscription", row.planType === "pro" ? "Downgrade" : "Upgrade", "Updated")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isRowBusy(row.id) || Boolean(row.deletedAt) || isSuperAdmin}
                          className="text-destructive focus:text-destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            void runAction({ action: "soft_delete", userId: row.id });
                          }}
                        >
                          {actionContent(row.id, "soft_delete", "Soft delete", "Moved to trash", "trash")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isRowBusy(row.id) || isSuperAdmin}
                          className="text-destructive focus:text-destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            const confirmed = window.confirm(
                              "This will permanently delete the user and all related records. Continue?",
                            );
                            if (!confirmed) return;
                            void runAction({ action: "hard_delete", userId: row.id });
                          }}
                        >
                          {actionContent(row.id, "hard_delete", "Delete permanently", "Deleted", "trash")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isRowBusy(row.id) || isSuperAdmin}
                          onSelect={(event) => {
                            event.preventDefault();
                            void runAction({ action: "impersonate", userId: row.id });
                          }}
                        >
                          {actionContent(row.id, "impersonate", "Impersonate", "Ready")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
