"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type NotificationTone = "success" | "error" | "info";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  tone: NotificationTone;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  notify: (notification: Omit<AppNotification, "id">) => void;
  dismiss: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const createId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (notification: Omit<AppNotification, "id">) => {
      const id = createId();
      setNotifications((current) => [...current, { id, ...notification }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notifications,
      notify,
      dismiss,
    }),
    [dismiss, notifications, notify],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationsProvider.");
  }

  return context;
};
