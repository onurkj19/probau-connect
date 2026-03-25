import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="auth-main">
      <div className="container flex justify-center px-4">
        <Card variant="static" className="w-full max-w-md border-border shadow-sm motion-safe:animate-card-enter">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-tight">
              {t("auth.forgot_password_title", { defaultValue: "Forgot password" })}
            </CardTitle>
            <CardDescription>
              {t("auth.forgot_password_description", {
                defaultValue: "Enter your email and we will send you a password reset link.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {sent && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {t("auth.forgot_password_sent", {
                  defaultValue: "Password reset email sent. Please check your inbox.",
                })}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "..."
                  : t("auth.send_reset_link", { defaultValue: "Send reset link" })}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to={`/${lang}/login`} className="font-medium text-primary hover:underline">
                {t("auth.back_to_login", { defaultValue: "Back to login" })}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ForgotPassword;
