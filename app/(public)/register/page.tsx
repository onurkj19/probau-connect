import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your ProBau.ch account as Arbeitsgeber or Unternehmer.",
};

const RegisterPage = () => (
  <AuthShell
    title="Create your account"
    description="Choose your role and start using the professional Swiss construction marketplace."
  >
    <RegisterForm />
  </AuthShell>
);

export default RegisterPage;
