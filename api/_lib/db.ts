/**
 * Database abstraction layer.
 *
 * This module defines the schema and operations for user subscription data.
 * Replace the implementation with your actual database (Supabase, Prisma, etc.).
 *
 * The interface is designed so that swapping the backend requires zero
 * changes to the API route handlers.
 */

import type { PlanType } from "./stripe";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

export interface UserSubscription {
  id: string;
  role: "owner" | "contractor";
  email: string;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  planType: PlanType | null;
  offerCountThisMonth: number;
  subscriptionCurrentPeriodEnd: string | null; // ISO date
}

// ---------------------------------------------------------------------------
// Database operations — replace these bodies with real DB queries
// ---------------------------------------------------------------------------

export async function getUserById(userId: string): Promise<UserSubscription | null> {
  // TODO: Replace with real query, e.g.:
  // return supabase.from('users').select('*').eq('id', userId).single()
  void userId;
  return null;
}

export async function getUserByStripeCustomerId(
  customerId: string,
): Promise<UserSubscription | null> {
  // TODO: Replace with real query
  void customerId;
  return null;
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
  // TODO: Replace with real update, e.g.:
  // await supabase.from('users').update(data).eq('id', userId)
  void userId;
  void data;
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
  // TODO: Replace with real update
  void customerId;
  void data;
}

export async function incrementOfferCount(userId: string): Promise<number> {
  // TODO: Replace with atomic increment, e.g.:
  // const { data } = await supabase.rpc('increment_offer_count', { user_id: userId })
  // return data.offer_count_this_month
  void userId;
  return 0;
}

export async function resetOfferCountForUser(userId: string): Promise<void> {
  await updateUserSubscription(userId, { offerCountThisMonth: 0 });
}

/*
 * SQL schema for reference (PostgreSQL / Supabase):
 *
 * CREATE TABLE users (
 *   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email           TEXT UNIQUE NOT NULL,
 *   name            TEXT NOT NULL,
 *   company_name    TEXT NOT NULL,
 *   role            TEXT NOT NULL CHECK (role IN ('owner', 'contractor')),
 *   stripe_customer_id          TEXT UNIQUE,
 *   subscription_status         TEXT NOT NULL DEFAULT 'none'
 *                                CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'none')),
 *   plan_type                   TEXT CHECK (plan_type IN ('basic', 'pro')),
 *   offer_count_this_month      INTEGER NOT NULL DEFAULT 0,
 *   subscription_current_period_end TIMESTAMPTZ,
 *   created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * -- Atomic offer count increment
 * CREATE OR REPLACE FUNCTION increment_offer_count(user_id UUID)
 * RETURNS TABLE(offer_count_this_month INTEGER) AS $$
 * UPDATE users
 *   SET offer_count_this_month = offer_count_this_month + 1,
 *       updated_at = now()
 *   WHERE id = user_id
 *   RETURNING offer_count_this_month;
 * $$ LANGUAGE sql;
 */
