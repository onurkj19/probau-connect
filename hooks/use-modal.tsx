"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ModalConfig {
  title: string;
  description?: string;
  content?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm?: () => void;
}

interface ModalContextValue {
  modal: ModalConfig | null;
  openModal: (modalConfig: ModalConfig) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalConfig | null>(null);

  const openModal = useCallback((modalConfig: ModalConfig) => {
    setModal(modalConfig);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo(
    () => ({
      modal,
      openModal,
      closeModal,
    }),
    [closeModal, modal, openModal],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used inside ModalProvider.");
  }
  return context;
};
