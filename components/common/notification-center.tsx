"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";

import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const notificationIcon = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export const NotificationCenter = () => {
  const { notifications, dismiss } = useNotifications();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => {
        const Icon = notificationIcon[notification.tone];
        return (
          <div
            key={notification.id}
            className={cn(
              "pointer-events-auto rounded-xl border bg-white p-4 shadow-card",
              notification.tone === "success" && "border-emerald-200",
              notification.tone === "error" && "border-red-200",
              notification.tone === "info" && "border-brand-100",
            )}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5",
                  notification.tone === "success" && "text-emerald-600",
                  notification.tone === "error" && "text-red-600",
                  notification.tone === "info" && "text-brand-900",
                )}
              />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-brand-900">{notification.title}</h4>
                <p className="mt-1 text-sm text-neutral-600">{notification.description}</p>
              </div>
              <button
                type="button"
                className="text-neutral-500 hover:text-neutral-900"
                onClick={() => dismiss(notification.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
