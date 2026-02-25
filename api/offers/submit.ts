import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../_lib/auth.js";
import { incrementOfferCount } from "../_lib/db.js";
import { PLANS } from "../_lib/stripe.js";
import { supabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only contractors submit offers
    if (user.role !== "contractor") {
      return res.status(403).json({ error: "Only contractors can submit offers" });
    }

    // Enforce active subscription
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({
        error: "subscription_required",
        message: "An active subscription is required to submit offers.",
      });
    }

    if (!user.planType) {
      return res.status(403).json({
        error: "subscription_required",
        message: "No active plan found.",
      });
    }

    // Enforce offer limit for Basic plan
    const plan = PLANS[user.planType];
    if (plan.monthlyOfferLimit !== null && user.offerCountThisMonth >= plan.monthlyOfferLimit) {
      return res.status(403).json({
        error: "offer_limit_reached",
        message: `Offer limit of ${plan.monthlyOfferLimit} reached for this billing cycle.`,
        limit: plan.monthlyOfferLimit,
        used: user.offerCountThisMonth,
      });
    }

    // ---- All checks passed — process the offer ----

    const {
      projectId,
      ownerId,
      priceChf,
      content,
      attachments,
      projectTitle,
      ownerCompanyName,
      contractorCompanyName,
    } = req.body as {
      projectId?: string;
      ownerId?: string;
      priceChf?: number;
      content?: string;
      attachments?: string[];
      projectTitle?: string;
      ownerCompanyName?: string;
      contractorCompanyName?: string;
    };

    if (!projectId || !ownerId || !content || typeof priceChf !== "number") {
      return res.status(400).json({ error: "projectId, ownerId, content and priceChf are required" });
    }

    // Atomically increment offer count
    const newCount = await incrementOfferCount(user.id);

    // Save offer row
    const { data: offerRow, error: offerError } = await supabaseAdmin
      .from("offers")
      .insert({
        project_id: projectId,
        contractor_id: user.id,
        owner_id: ownerId,
        price_chf: priceChf,
        message: content,
        attachments: attachments ?? [],
        status: "submitted",
      })
      .select("id")
      .single();

    if (offerError || !offerRow) throw offerError || new Error("Offer persistence failed");

    // Create or load chat between these two parties for the project
    const { data: existingChat } = await supabaseAdmin
      .from("chats")
      .select("id")
      .eq("project_id", projectId)
      .eq("owner_id", ownerId)
      .eq("contractor_id", user.id)
      .maybeSingle();

    let chatId = existingChat?.id;
    if (!chatId) {
      const { data: createdChat, error: chatCreateError } = await supabaseAdmin
        .from("chats")
        .insert({
          project_id: projectId,
          offer_id: offerRow.id,
          owner_id: ownerId,
          contractor_id: user.id,
          owner_company_name: ownerCompanyName ?? null,
          contractor_company_name: contractorCompanyName ?? null,
          project_title: projectTitle ?? null,
        })
        .select("id")
        .single();
      if (chatCreateError || !createdChat) throw chatCreateError || new Error("Chat creation failed");
      chatId = createdChat.id;
    }

    // Initial message in chat
    const summaryMessage = `Offer submitted: CHF ${priceChf.toFixed(2)}\n\n${content}`;
    const { error: chatMsgError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        message: summaryMessage,
        attachments: attachments ?? [],
      });
    if (chatMsgError) throw chatMsgError;

    return res.status(200).json({
      success: true,
      offerId: offerRow.id,
      chatId,
      offerCountThisMonth: newCount,
      limit: plan.monthlyOfferLimit,
    });
  } catch (err: any) {
    console.error("Offer submission error:", err);
    return res.status(500).json({ error: "Failed to submit offer" });
  }
}
