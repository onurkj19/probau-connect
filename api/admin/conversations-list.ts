import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsePagination, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  try {
    const { from, to, page, pageSize } = parsePagination(req);
    const { data, error, count } = await supabaseAdmin
      .from("chats")
      .select("id, project_id, owner_id, contractor_id, project_title, created_at, updated_at", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (error) throw error;

    const rows = data ?? [];
    const chatIds = rows.map((row) => row.id);
    const userIds = [...new Set(rows.flatMap((row) => [row.owner_id, row.contractor_id]))];
    const [messagesRes, usersRes] = await Promise.all([
      chatIds.length > 0
        ? supabaseAdmin.from("chat_messages").select("id, chat_id, created_at").in("chat_id", chatIds)
        : Promise.resolve({ data: [] as { id: string; chat_id: string; created_at: string }[] }),
      userIds.length > 0
        ? supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; name: string; email: string }[] }),
    ]);

    const messages = messagesRes.data ?? [];
    const users = usersRes.data ?? [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const messageCountByChat = messages.reduce<Record<string, number>>((acc, row) => {
      acc[row.chat_id] = (acc[row.chat_id] ?? 0) + 1;
      return acc;
    }, {});
    const lastMessageAtByChat = messages.reduce<Record<string, string | null>>((acc, row) => {
      const current = acc[row.chat_id];
      if (!current || new Date(row.created_at).getTime() > new Date(current).getTime()) {
        acc[row.chat_id] = row.created_at;
      }
      return acc;
    }, {});

    return res.status(200).json({
      page,
      pageSize,
      total: count ?? 0,
      rows: rows.map((row) => ({
        ...row,
        ownerName: userById.get(row.owner_id)?.name ?? "",
        ownerEmail: userById.get(row.owner_id)?.email ?? "",
        contractorName: userById.get(row.contractor_id)?.name ?? "",
        contractorEmail: userById.get(row.contractor_id)?.email ?? "",
        messageCount: messageCountByChat[row.id] ?? 0,
        lastMessageAt: lastMessageAtByChat[row.id] ?? null,
      })),
    });
  } catch (error) {
    console.error("Admin conversations list error", error);
    return res.status(500).json({ error: "Failed to load conversations" });
  }
}
