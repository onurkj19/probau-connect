"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { loginUser } from "@/lib/api/auth-client";
import { useNotifications } from "@/hooks/use-notifications";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must have at least 6 characters."),
  role: z.enum(["employer", "contractor"]),
  company: z.string().min(2, "Company is required."),
  name: z.string().min(2, "Name is required."),
  isSubscribed: z.boolean(),
  plan: z.enum(["basic", "pro"]),
});

type LoginInput = z.infer<typeof loginSchema>;

export const LoginForm = ({ redirectPath }: { redirectPath?: string }) => {
  const router = useRouter();
  const { notify } = useNotifications();

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
        title: "Login failed",
        description: response.message ?? "Please check your credentials.",
      });
      return;
    }

    notify({
      tone: "success",
      title: "Welcome back",
      description: "Login successful.",
    });

    router.push(redirectPath || "/dashboard");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Business email" error={errors.email?.message}>
        <Input type="email" placeholder="name@company.ch" {...register("email")} />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <Input type="password" placeholder="••••••••" {...register("password")} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Full name" error={errors.name?.message}>
          <Input placeholder="Max Muster" {...register("name")} />
        </FormField>
        <FormField label="Company" error={errors.company?.message}>
          <Input placeholder="Musterbau AG" {...register("company")} />
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
            Simulate active subscription
            <input type="checkbox" className="h-4 w-4" {...register("isSubscribed")} />
          </label>
          <p className="mt-2 text-xs text-neutral-500">
            Enable this to access offer submission directly after login.
          </p>
          <div className="mt-3">
            <Select {...register("plan")}>
              <option value="basic">Basic (CHF 79)</option>
              <option value="pro">Pro (CHF 149)</option>
            </Select>
          </div>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};
