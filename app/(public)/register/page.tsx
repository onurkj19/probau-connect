import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {};

const RegisterPage = async () => {
  const t = await getTranslations("auth.register");

  return (
    <AuthShell title={t("title")} description={t("description")}>
      <RegisterForm />
    </AuthShell>
  );
};

export default RegisterPage;
