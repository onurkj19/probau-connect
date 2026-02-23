"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";
import type { SubscriptionPlan } from "@/types/subscription";

interface SubscriptionManagementProps {
  user: SessionUser;
  plans: SubscriptionPlan[];
}

export const SubscriptionManagement = ({ user, plans }: SubscriptionManagementProps) => {
  const router = useRouter();
  const { notify } = useNotifications();
  const { openModal } = useModal();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {plans.map((plan) => {
        const isCurrent = user.plan === plan.id && user.isSubscribed;

        return (
          <Card key={plan.id} className={isCurrent ? "border-brand-900" : undefined}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-neutral-600">{plan.description}</p>
              </div>
              {isCurrent ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-3xl font-bold text-brand-900">{formatCurrency(plan.monthlyChf)}</p>
            <p className="text-sm text-neutral-500">per month</p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>

            <div className="mt-6">
              {isCurrent ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    openModal({
                      title: "Cancel subscription",
                      description:
                        "Your access to offer submissions will be removed at the end of your billing period.",
                      tone: "danger",
                      confirmLabel: "Confirm cancellation",
                      onConfirm: () => {
                        notify({
                          tone: "info",
                          title: "Cancellation requested",
                          description: "This is a demo action. Billing backend integration is next step.",
                        });
                      },
                    })
                  }
                >
                  Cancel plan
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    openModal({
                      title: `Activate ${plan.name}`,
                      description: `Activate ${plan.name} for ${formatCurrency(plan.monthlyChf)} per month?`,
                      confirmLabel: "Activate plan",
                      onConfirm: () => {
                        notify({
                          tone: "success",
                          title: "Plan activated",
                          description: "Your subscription has been activated in this demo flow.",
                        });
                        router.refresh();
                      },
                    })
                  }
                >
                  Choose {plan.name}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
