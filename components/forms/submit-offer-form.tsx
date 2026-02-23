"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FileUpload } from "@/components/common/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "@/types/project";

const submitOfferSchema = z.object({
  amountChf: z.coerce.number().min(1000, "Offer amount must be at least CHF 1,000."),
  message: z.string().min(24, "Please add enough details for your offer."),
});

type SubmitOfferInput = z.infer<typeof submitOfferSchema>;

export const SubmitOfferForm = ({ project }: { project: Project }) => {
  const router = useRouter();
  const { notify } = useNotifications();

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

  const onSubmit = async (_values: SubmitOfferInput) => {
    notify({
      tone: "success",
      title: "Offer submitted",
      description: "Your offer was submitted successfully.",
    });
    router.push("/dashboard/contractor/my-offers");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
        <p className="font-semibold text-brand-900">{project.title}</p>
        <p className="mt-1 text-neutral-600">Reference budget: {formatCurrency(project.budgetChf)}</p>
      </div>

      <FormField label="Offer amount (CHF)" error={errors.amountChf?.message}>
        <Input type="number" min={1000} step={500} {...register("amountChf")} />
      </FormField>

      <FormField label="Offer details" error={errors.message?.message}>
        <Textarea
          placeholder="Scope, schedule, assumptions, guarantees and exclusions."
          {...register("message")}
        />
      </FormField>

      <FileUpload label="Supporting files" />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit offer"}
      </Button>
    </form>
  );
};
