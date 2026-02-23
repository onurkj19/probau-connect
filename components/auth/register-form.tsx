"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { registerUser } from "@/lib/api/auth-client";
import { getRoleHomePath } from "@/lib/navigation/role-paths";
import { useNotifications } from "@/hooks/use-notifications";

export const RegisterForm = () => {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const { notify } = useNotifications();

  const registerSchema = z
    .object({
      email: z.string().email(t("errors.email")),
      password: z.string().min(8, t("errors.password")),
      confirmPassword: z.string().min(8, t("errors.confirmPassword")),
      role: z.enum(["employer", "contractor"]),
      company: z.string().min(2, t("errors.company")),
      name: z.string().min(2, t("errors.name")),
      isSubscribed: z.boolean(),
      plan: z.enum(["basic", "pro"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMatch"),
      path: ["confirmPassword"],
    });

  type RegisterInput = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "employer",
      isSubscribed: false,
      plan: "basic",
    },
  });

  const role = watch("role");

  const onSubmit = async (values: RegisterInput) => {
    const response = await registerUser({
      email: values.email,
      password: values.password,
      role: values.role,
      company: values.company,
      name: values.name,
      isSubscribed: values.isSubscribed,
      plan: values.plan,
    });

    if (!response.ok) {
      notify({
        tone: "error",
        title: t("toastErrorTitle"),
        description: response.message ?? t("toastErrorDescription"),
      });
      return;
    }

    notify({
      tone: "success",
      title: t("toastSuccessTitle"),
      description: t("toastSuccessDescription"),
    });

    const fallbackPath = response.session ? getRoleHomePath(response.session.role) : "/login";
    router.push(fallbackPath);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t("fullNameLabel")} error={errors.name?.message}>
          <Input placeholder="Max Muster" {...register("name")} />
        </FormField>
        <FormField label={t("companyLabel")} error={errors.company?.message}>
          <Input placeholder="Musterbau AG" {...register("company")} />
        </FormField>
      </div>

      <FormField label={t("emailLabel")} error={errors.email?.message}>
        <Input type="email" placeholder="name@company.ch" {...register("email")} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t("passwordLabel")} error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register("password")} />
        </FormField>
        <FormField label={t("confirmPasswordLabel")} error={errors.confirmPassword?.message}>
          <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
        </FormField>
      </div>

      <FormField label={t("roleLabel")} error={errors.role?.message}>
        <Select {...register("role")}>
          <option value="employer">{t("roleEmployer")}</option>
          <option value="contractor">{t("roleContractor")}</option>
        </Select>
      </FormField>

      {role === "contractor" ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-brand-900">
            {t("subscriptionStart")}
            <input type="checkbox" className="h-4 w-4" {...register("isSubscribed")} />
          </label>
          <div className="mt-3">
            <Select {...register("plan")}>
              <option value="basic">{t("planBasic")}</option>
              <option value="pro">{t("planPro")}</option>
            </Select>
          </div>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitLoading") : t("submitIdle")}
      </Button>
    </form>
  );
};
