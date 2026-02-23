"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FileUpload } from "@/components/common/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "@/types/project";

export const SubmitOfferForm = ({ project }: { project: Project }) => {
  const t = useTranslations("projects.offerForm");
  const router = useRouter();
  const { notify } = useNotifications();

  const submitOfferSchema = z.object({
    amountChf: z.coerce.number().min(1000, t("errors.amount")),
    message: z.string().min(24, t("errors.message")),
  });

  type SubmitOfferInput = z.infer<typeof submitOfferSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmitOfferInput>({
    resolver: zodResolver(submitOfferSchema),
    defaultValues: {
      amountChf: Math.round(project.budgetChf * 0.93),
    },
  });

  const onSubmit = (_values: SubmitOfferInput) => {
    notify({
      tone: "success",
      title: t("toastTitle"),
      description: t("toastDescription"),
    });
    router.push("/unternehmer/offers");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
        <p className="font-semibold text-brand-900">{project.title}</p>
        <p className="mt-1 text-neutral-600">
          {t("referenceBudget", { budget: formatCurrency(project.budgetChf) })}
        </p>
      </div>

      <FormField label={t("amountLabel")} error={errors.amountChf?.message}>
        <Input type="number" min={1000} step={500} {...register("amountChf")} />
      </FormField>

      <FormField label={t("detailsLabel")} error={errors.message?.message}>
        <Textarea placeholder={t("detailsPlaceholder")} {...register("message")} />
      </FormField>

      <FileUpload label={t("filesLabel")} />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("submitLoading") : t("submitIdle")}
      </Button>
    </form>
  );
};
