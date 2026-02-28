import { supabase } from "@/lib/supabase";

export const BASE_PLAN_PRICES = {
  basic: 79,
  pro: 149,
} as const;

export async function fetchDefaultSubscriptionDiscountPercent(): Promise<number> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "subscription_discount_config")
    .maybeSingle();
  if (error || !data?.value) return 0;
  const value = data.value as { enabled?: boolean; percentOff?: unknown };
  if (!value.enabled) return 0;
  const percent = Number(value.percentOff ?? 0);
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(100, percent);
}

export function applyPercentDiscount(basePrice: number, percent: number): number {
  const discounted = basePrice * (1 - percent / 100);
  return Number(discounted.toFixed(2));
}

export function formatChf(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
