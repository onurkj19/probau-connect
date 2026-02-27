import { supabaseAdmin } from "./supabase.js";
import type { PlanType } from "./stripe.js";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

export interface UserSubscription {
  id: string;
  role: "super_admin" | "admin" | "moderator" | "project_owner" | "contractor";
  email: string;
  isBanned: boolean;
  deletedAt: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  planType: PlanType | null;
  offerCountThisMonth: number;
  subscriptionCurrentPeriodEnd: string | null;
}

function mapRow(row: any): UserSubscription {
  return {
    id: row.id,
    role: row.role,
    email: row.email,
    isBanned: Boolean(row.is_banned),
    deletedAt: row.deleted_at ?? null,
    stripeCustomerId: row.stripe_customer_id,
    subscriptionStatus: row.subscription_status,
    planType: row.plan_type,
    offerCountThisMonth: row.offer_count_this_month,
    subscriptionCurrentPeriodEnd: row.subscription_current_period_end,
  };
}

export async function getUserById(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

export async function getUserByStripeCustomerId(
  customerId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

export async function updateUserSubscription(
  userId: string,
  data: Partial<
    Pick<
      UserSubscription,
      | "stripeCustomerId"
      | "subscriptionStatus"
      | "planType"
      | "subscriptionCurrentPeriodEnd"
      | "offerCountThisMonth"
    >
  >,
): Promise<void> {
  const updateData: Record<string, any> = {};
  if (data.stripeCustomerId !== undefined) updateData.stripe_customer_id = data.stripeCustomerId;
  if (data.subscriptionStatus !== undefined) updateData.subscription_status = data.subscriptionStatus;
  if (data.planType !== undefined) updateData.plan_type = data.planType;
  if (data.subscriptionCurrentPeriodEnd !== undefined) updateData.subscription_current_period_end = data.subscriptionCurrentPeriodEnd;
  if (data.offerCountThisMonth !== undefined) updateData.offer_count_this_month = data.offerCountThisMonth;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user subscription:", error);
    throw error;
  }
}

export async function updateUserByStripeCustomerId(
  customerId: string,
  data: Partial<
    Pick<
      UserSubscription,
      "subscriptionStatus" | "planType" | "subscriptionCurrentPeriodEnd" | "offerCountThisMonth"
    >
  >,
): Promise<void> {
  const updateData: Record<string, any> = {};
  if (data.subscriptionStatus !== undefined) updateData.subscription_status = data.subscriptionStatus;
  if (data.planType !== undefined) updateData.plan_type = data.planType;
  if (data.subscriptionCurrentPeriodEnd !== undefined) updateData.subscription_current_period_end = data.subscriptionCurrentPeriodEnd;
  if (data.offerCountThisMonth !== undefined) updateData.offer_count_this_month = data.offerCountThisMonth;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updateData)
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Failed to update user by stripe customer:", error);
    throw error;
  }
}

export async function incrementOfferCount(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("increment_offer_count", {
    user_id: userId,
  });

  if (error) {
    console.error("Failed to increment offer count:", error);
    throw error;
  }

  return data as number;
}

export async function resetOfferCountForUser(userId: string): Promise<void> {
  await updateUserSubscription(userId, { offerCountThisMonth: 0 });
}
