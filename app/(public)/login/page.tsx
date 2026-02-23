import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your ProBau.ch account.",
};

interface LoginPageProps {
  searchParams: Promise<{
    redirect?: string;
  }>;
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams;

  return (
    <AuthShell
      title="Sign in to ProBau.ch"
      description="Access your role-based dashboard and manage projects or offers."
    >
      <LoginForm redirectPath={params.redirect} />
    </AuthShell>
  );
};

export default LoginPage;
