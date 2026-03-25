import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeletonRows } from "@/components/common/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagesSquare } from "lucide-react";

interface ConversationRow {
  id: string;
  project_title: string | null;
  owner_id: string;
  contractor_id: string;
  ownerName: string;
  ownerEmail: string;
  contractorName: string;
  contractorEmail: string;
  messageCount: number;
  lastMessageAt: string | null;
  updated_at: string;
}

interface ConversationsResponse {
  rows: ConversationRow[];
}

const AdminConversations = () => {
  const { getToken } = useAuth();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<ConversationsResponse>("/api/admin/conversations-list?page=1&pageSize=50", getToken);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    row: ConversationRow,
    action: "delete_chat" | "clear_messages" | "block_user" | "unblock_user",
  ) => {
    setActiveId(row.id);
    setError(null);
    try {
      await adminFetch("/api/admin/conversations-action", getToken, {
        method: "POST",
        body: JSON.stringify({
          action,
          chatId: row.id,
          blockerId: row.owner_id,
          blockedId: row.contractor_id,
        }),
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
        <h1 className="page-title">Conversations Moderation</h1>
        <p className="page-subtitle">Monitor chats and take moderation actions.</p>
      </div>

      <div className="app-card-frame">
        <div className="flex min-h-[44px] items-center border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-48 border-0 bg-muted/60" />
          ) : (
            `${rows.length} conversations`
          )}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="app-data-table min-w-[1300px]">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Contractor</th>
                <th>Messages</th>
                <th>Last message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} columns={6} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={MessagesSquare}
                      title="No conversations"
                      description="Chats between owners and contractors will show here."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.project_title || "-"}</td>
                    <td>
                      <p>{row.ownerName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.ownerEmail || "-"}</p>
                    </td>
                    <td>
                      <p>{row.contractorName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{row.contractorEmail || "-"}</p>
                    </td>
                    <td>{row.messageCount}</td>
                    <td>{row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : "-"}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={activeId === row.id} onClick={() => void runAction(row, "clear_messages")}>
                          Clear messages
                        </Button>
                        <Button size="sm" variant="outline" disabled={activeId === row.id} onClick={() => void runAction(row, "block_user")}>
                          Block pair
                        </Button>
                        <Button size="sm" variant="outline" disabled={activeId === row.id} onClick={() => void runAction(row, "unblock_user")}>
                          Unblock pair
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={activeId === row.id}
                          onClick={() => void runAction(row, "delete_chat")}
                        >
                          Delete chat
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

export default AdminConversations;
