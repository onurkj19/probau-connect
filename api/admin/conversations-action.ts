import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestIp, isUuid, logSecurityEvent, requireAdmin } from "../_lib/admin.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type ConversationAction = "delete_chat" | "clear_messages" | "block_user" | "unblock_user";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const actor = await requireAdmin(req, res);
  if (!actor) return;

  const { action, chatId, blockerId, blockedId } = (req.body ?? {}) as {
    action?: ConversationAction;
    chatId?: string;
    blockerId?: string;
    blockedId?: string;
  };
  if (!action) return res.status(400).json({ error: "Missing action" });

  try {
    if (action === "delete_chat") {
      if (!chatId || !isUuid(chatId)) return res.status(400).json({ error: "Missing chatId" });
      await supabaseAdmin.from("chats").delete().eq("id", chatId);
    } else if (action === "clear_messages") {
      if (!chatId || !isUuid(chatId)) return res.status(400).json({ error: "Missing chatId" });
      await supabaseAdmin.from("chat_messages").delete().eq("chat_id", chatId);
    } else if (action === "block_user") {
      if (!blockerId || !blockedId || !isUuid(blockerId) || !isUuid(blockedId)) return res.status(400).json({ error: "Missing blockerId or blockedId" });
      await supabaseAdmin.from("blocked_users").upsert({ blocker_id: blockerId, blocked_id: blockedId });
    } else if (action === "unblock_user") {
      if (!blockerId || !blockedId || !isUuid(blockerId) || !isUuid(blockedId)) return res.status(400).json({ error: "Missing blockerId or blockedId" });
      await supabaseAdmin.from("blocked_users").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
    } else {
      return res.status(400).json({ error: "Unsupported action" });
    }

    await logSecurityEvent({
      eventType: `admin_conversation_${action}`,
      actorId: actor.id,
      ipAddress: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
      details: { chatId: chatId ?? null, blockerId: blockerId ?? null, blockedId: blockedId ?? null },
      severity: "warning",
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Admin conversations action error", error);
    return res.status(500).json({ error: "Failed to execute conversation action" });
  }
}
