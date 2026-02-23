import { subscriptionPlans } from "@/lib/data/mock-projects";
import type { SubscriptionPlan, SubscriptionPlanId } from "@/types/subscription";

const wait = async (ms = 90): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const listSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  await wait();
  return subscriptionPlans;
};

export const getSubscriptionPlan = async (
  planId: SubscriptionPlanId,
): Promise<SubscriptionPlan | undefined> => {
  await wait();
  return subscriptionPlans.find((plan) => plan.id === planId);
};
