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
import { loginUser } from "@/lib/api/auth-client";
import { getRoleHomePath } from "@/lib/navigation/role-paths";
import { useNotifications } from "@/hooks/use-notifications";

export const LoginForm = ({ redirectPath }: { redirectPath?: string }) => {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const { notify } = useNotifications();

  const loginSchema = z.object({
    email: z.string().email(t("errors.email")),
    password: z.string().min(6, t("errors.password")),
    role: z.enum(["employer", "contractor"]),
    company: z.string().min(2, t("errors.company")),
    name: z.string().min(2, t("errors.name")),
    isSubscribed: z.boolean(),
    plan: z.enum(["basic", "pro"]),
  });

  type LoginInput = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "employer",
      isSubscribed: false,
      plan: "basic",
    },
  });

  const role = watch("role");

  const onSubmit = async (values: LoginInput) => {
    const response = await loginUser(values);

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
    router.push(redirectPath || fallbackPath);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label={t("emailLabel")} error={errors.email?.message}>
        <Input type="email" placeholder="name@company.ch" {...register("email")} />
      </FormField>

      <FormField label={t("passwordLabel")} error={errors.password?.message}>
        <Input type="password" placeholder="••••••••" {...register("password")} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t("fullNameLabel")} error={errors.name?.message}>
          <Input placeholder="Max Muster" {...register("name")} />
        </FormField>
        <FormField label={t("companyLabel")} error={errors.company?.message}>
          <Input placeholder="Musterbau AG" {...register("company")} />
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
            {t("subscriptionSimulate")}
            <input type="checkbox" className="h-4 w-4" {...register("isSubscribed")} />
          </label>
          <p className="mt-2 text-xs text-neutral-500">{t("subscriptionHint")}</p>
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
