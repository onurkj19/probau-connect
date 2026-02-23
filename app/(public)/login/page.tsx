import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {};

interface LoginPageProps {
  searchParams: Promise<{
    redirect?: string;
  }>;
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const t = await getTranslations("auth.login");
  const params = await searchParams;

  return (
    <AuthShell
      title={t("title")}
      description={t("description")}
    >
      <LoginForm redirectPath={params.redirect} />
    </AuthShell>
  );
};

export default LoginPage;
