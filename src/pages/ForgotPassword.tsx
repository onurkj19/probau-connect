import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { requestPasswordReset, isLoading } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await requestPasswordReset(email.trim(), `${window.location.origin}/${lang}/reset-password`, lang);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    }
  };

  return (
    <main className="bg-background py-20">
      <div className="container flex justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("auth.forgot_password_title", { defaultValue: "Forgot password" })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.forgot_password_description", {
              defaultValue: "Enter your email and we will send you a password reset link.",
            })}
          </p>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {sent && (
            <div className="mt-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700">
              {t("auth.forgot_password_sent", {
                defaultValue: "Password reset email sent. Please check your inbox.",
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "..."
                : t("auth.send_reset_link", { defaultValue: "Send reset link" })}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to={`/${lang}/login`} className="font-medium text-primary hover:underline">
              {t("auth.back_to_login", { defaultValue: "Back to login" })}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
