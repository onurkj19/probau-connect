"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";

export const ModalRoot = () => {
  const t = useTranslations("common.modal");
  const { modal, closeModal } = useModal();

  if (!modal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-950/35 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
        <h3 className="text-xl font-semibold text-brand-900">{modal.title}</h3>
        {modal.description ? <p className="mt-2 text-sm text-neutral-600">{modal.description}</p> : null}
        {modal.content ? <div className="mt-4">{modal.content}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeModal}>
            {modal.cancelLabel ?? t("cancel")}
          </Button>
          <Button
            variant={modal.tone === "danger" ? "danger" : "primary"}
            onClick={() => {
              modal.onConfirm?.();
              closeModal();
            }}
          >
            {modal.confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
};
