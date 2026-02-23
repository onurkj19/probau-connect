"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FileUpload } from "@/components/common/file-upload";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/hooks/use-modal";
import { useNotifications } from "@/hooks/use-notifications";

const createProjectSchema = z.object({
  title: z.string().min(6, "Project title is required."),
  description: z.string().min(24, "Please provide a clear project description."),
  category: z.string().min(2, "Category is required."),
  canton: z.string().min(2, "Canton is required."),
  location: z.string().min(2, "Location is required."),
  budgetChf: z.coerce.number().min(1000, "Budget must be at least CHF 1,000."),
  deadlineIso: z.string().min(1, "Please choose a deadline."),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

const categories = ["Rohbau", "Tiefbau", "Elektro", "HLKS", "Innenausbau"];
const cantons = ["ZH", "BE", "BS", "VD", "LU", "SG", "AG", "GE"];

export const CreateProjectForm = () => {
  const { notify } = useNotifications();
  const { openModal } = useModal();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const onSubmit = async (_values: CreateProjectInput) => {
    openModal({
      title: "Publish project",
      description: "Do you want to publish this project now?",
      confirmLabel: "Publish",
      onConfirm: () => {
        notify({
          tone: "success",
          title: "Project published",
          description: "Your project is now visible to Unternehmer.",
        });
        reset();
      },
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Project title" error={errors.title?.message}>
        <Input placeholder="New residential building - facade works" {...register("title")} />
      </FormField>

      <FormField label="Project description" error={errors.description?.message}>
        <Textarea
          placeholder="Describe scope, technical requirements, timeline and access conditions."
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Category" error={errors.category?.message}>
          <Select {...register("category")}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Canton" error={errors.canton?.message}>
          <Select {...register("canton")}>
            <option value="">Select canton</option>
            {cantons.map((canton) => (
              <option key={canton} value={canton}>
                {canton}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="Location" error={errors.location?.message}>
          <Input placeholder="Zurich" {...register("location")} />
        </FormField>
        <FormField label="Budget (CHF)" error={errors.budgetChf?.message}>
          <Input type="number" min={1000} step={1000} placeholder="250000" {...register("budgetChf")} />
        </FormField>
        <FormField label="Submission deadline" error={errors.deadlineIso?.message}>
          <Input type="datetime-local" {...register("deadlineIso")} />
        </FormField>
      </div>

      <FileUpload label="Attachments" />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publishing..." : "Publish project"}
      </Button>
    </form>
  );
};
