export type SubscriptionPlanId = "basic" | "pro";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  monthlyChf: number;
  description: string;
  features: string[];
}
