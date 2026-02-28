import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../_lib/auth.js";
import { supabaseAdmin } from "../_lib/supabase.js";

type OfferAction = "accept" | "reject";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return "Unexpected error";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { action, offerId, chatId } = (req.body ?? {}) as {
      action?: OfferAction;
      offerId?: string;
      chatId?: string;
    };
    if (!action || !offerId) {
      return res.status(400).json({ error: "action and offerId are required" });
    }
    if (action !== "accept" && action !== "reject") {
      return res.status(400).json({ error: "Unsupported action" });
    }

    const { data: offer, error: offerError } = await supabaseAdmin
      .from("offers")
      .select("id, project_id, owner_id, contractor_id, price_chf, status")
      .eq("id", offerId)
      .maybeSingle();
    if (offerError) throw offerError;
    if (!offer) return res.status(404).json({ error: "Offer not found" });

    if (user.id !== offer.owner_id) {
      return res.status(403).json({ error: "Only the project owner can accept/reject this offer" });
    }

    if (offer.status !== "submitted") {
      return res.status(400).json({ error: "Only submitted offers can be accepted/rejected" });
    }

    const nextStatus = action === "accept" ? "accepted" : "rejected";
    const { error: updateError } = await supabaseAdmin
      .from("offers")
      .update({ status: nextStatus })
      .eq("id", offer.id);
    if (updateError) throw updateError;

    let resolvedChatId = chatId ?? null;
    if (!resolvedChatId) {
      const { data: chat } = await supabaseAdmin
        .from("chats")
        .select("id")
        .eq("project_id", offer.project_id)
        .eq("owner_id", offer.owner_id)
        .eq("contractor_id", offer.contractor_id)
        .maybeSingle();
      resolvedChatId = chat?.id ?? null;
    }

    if (resolvedChatId) {
      await supabaseAdmin.from("chat_messages").insert({
        chat_id: resolvedChatId,
        sender_id: user.id,
        message:
          action === "accept"
            ? `Offer accepted: CHF ${Number(offer.price_chf).toFixed(2)}`
            : `Offer rejected: CHF ${Number(offer.price_chf).toFixed(2)}`,
        attachments: [],
      });
    }

    return res.status(200).json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Offer action error", error);
    return res.status(500).json({ error: `Failed to process offer action: ${getErrorMessage(error)}` });
  }
}
