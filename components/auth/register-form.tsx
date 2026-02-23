"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { registerUser } from "@/lib/api/auth-client";
import { getRoleHomePath } from "@/lib/navigation/role-paths";
import { useNotifications } from "@/hooks/use-notifications";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(8, "Password must have at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
    role: z.enum(["employer", "contractor"]),
    company: z.string().min(2, "Company is required."),
    name: z.string().min(2, "Name is required."),
    isSubscribed: z.boolean(),
    plan: z.enum(["basic", "pro"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const router = useRouter();
  const { notify } = useNotifications();

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
        title: "Registration failed",
        description: response.message ?? "Please verify your information and retry.",
      });
      return;
    }

    notify({
      tone: "success",
      title: "Account created",
      description: "Welcome to ProBau.ch.",
    });

    const fallbackPath = response.session ? getRoleHomePath(response.session.role) : "/login";
    router.push(fallbackPath);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Full name" error={errors.name?.message}>
          <Input placeholder="Max Muster" {...register("name")} />
        </FormField>
        <FormField label="Company" error={errors.company?.message}>
          <Input placeholder="Musterbau AG" {...register("company")} />
        </FormField>
      </div>

      <FormField label="Business email" error={errors.email?.message}>
        <Input type="email" placeholder="name@company.ch" {...register("email")} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Password" error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register("password")} />
        </FormField>
        <FormField label="Confirm password" error={errors.confirmPassword?.message}>
          <Input type="password" placeholder="••••••••" {...register("confirmPassword")} />
        </FormField>
      </div>

      <FormField label="Account role" error={errors.role?.message}>
        <Select {...register("role")}>
          <option value="employer">Arbeitsgeber</option>
          <option value="contractor">Unternehmer</option>
        </Select>
      </FormField>

      {role === "contractor" ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <label className="flex items-center justify-between gap-3 text-sm font-medium text-brand-900">
            Start with active subscription
            <input type="checkbox" className="h-4 w-4" {...register("isSubscribed")} />
          </label>
          <div className="mt-3">
            <Select {...register("plan")}>
              <option value="basic">Basic (CHF 79)</option>
              <option value="pro">Pro (CHF 149)</option>
            </Select>
          </div>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
};
