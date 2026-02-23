"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FileUpload } from "@/components/common/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { useModal } from "@/hooks/use-modal";

const categories = ["Rohbau", "Tiefbau", "Elektro", "HLKS", "Innenausbau"];
const cantons = ["ZH", "BE", "BS", "VD", "LU", "SG", "AG", "GE"];

export const CreateProjectForm = () => {
  const t = useTranslations("projects.createForm");
  const { notify } = useNotifications();
  const { openModal } = useModal();

  const createProjectSchema = z.object({
    title: z.string().min(6, t("errors.title")),
    description: z.string().min(24, t("errors.description")),
    category: z.string().min(2, t("errors.category")),
    canton: z.string().min(2, t("errors.canton")),
    location: z.string().min(2, t("errors.location")),
    budgetChf: z.coerce.number().min(1000, t("errors.budget")),
    deadlineIso: z.string().min(1, t("errors.deadline")),
  });

  type CreateProjectInput = z.infer<typeof createProjectSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const onSubmit = (_values: CreateProjectInput) => {
    openModal({
      title: t("modalTitle"),
      description: t("modalDescription"),
      confirmLabel: t("submitIdle"),
      onConfirm: () => {
        notify({
          tone: "success",
          title: t("toastTitle"),
          description: t("toastDescription"),
        });
        reset();
      },
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label={t("titleLabel")} error={errors.title?.message}>
        <Input placeholder={t("titlePlaceholder")} {...register("title")} />
      </FormField>

      <FormField label={t("descriptionLabel")} error={errors.description?.message}>
        <Textarea placeholder={t("descriptionPlaceholder")} {...register("description")} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t("categoryLabel")} error={errors.category?.message}>
          <Select {...register("category")}>
            <option value="">{t("categoryPlaceholder")}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label={t("cantonLabel")} error={errors.canton?.message}>
          <Select {...register("canton")}>
            <option value="">{t("cantonPlaceholder")}</option>
            {cantons.map((canton) => (
              <option key={canton} value={canton}>
                {canton}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label={t("locationLabel")} error={errors.location?.message}>
          <Input placeholder={t("locationPlaceholder")} {...register("location")} />
        </FormField>
        <FormField label={t("budgetLabel")} error={errors.budgetChf?.message}>
          <Input type="number" min={1000} step={1000} placeholder="250000" {...register("budgetChf")} />
        </FormField>
        <FormField label={t("deadlineLabel")} error={errors.deadlineIso?.message}>
          <Input type="date" {...register("deadlineIso")} />
        </FormField>
      </div>

      <FileUpload label={t("attachmentsLabel")} />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("submitLoading") : t("submitIdle")}
      </Button>
    </form>
  );
};
