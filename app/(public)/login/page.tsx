import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your ProBau.ch account.",
};

const LoginPage = () => (
  <AuthShell
    title="Sign in to ProBau.ch"
    description="Access your role-based dashboard and manage projects or offers."
  >
    <LoginForm />
  </AuthShell>
);

export default LoginPage;
