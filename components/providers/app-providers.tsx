"use client";

import type { ReactNode } from "react";

import { ModalRoot } from "@/components/common/modal-root";
import { NotificationCenter } from "@/components/common/notification-center";
import { ModalProvider } from "@/hooks/use-modal";
import { NotificationsProvider } from "@/hooks/use-notifications";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <NotificationsProvider>
    <ModalProvider>
      {children}
      <NotificationCenter />
      <ModalRoot />
    </ModalProvider>
  </NotificationsProvider>
);
