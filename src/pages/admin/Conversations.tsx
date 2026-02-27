import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Conversations Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor chats and take moderation actions.</p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {loading ? "Loading conversations..." : `${rows.length} conversations`}
        </div>
        {error && <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-[1300px] w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Contractor</th>
                <th className="px-3 py-2 font-medium">Messages</th>
                <th className="px-3 py-2 font-medium">Last message</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{row.project_title || "-"}</td>
                  <td className="px-3 py-2">
                    <p>{row.ownerName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.ownerEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p>{row.contractorName || "-"}</p>
                    <p className="text-xs text-muted-foreground">{row.contractorEmail || "-"}</p>
                  </td>
                  <td className="px-3 py-2">{row.messageCount}</td>
                  <td className="px-3 py-2">
                    {row.lastMessageAt ? new Date(row.lastMessageAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminConversations;
