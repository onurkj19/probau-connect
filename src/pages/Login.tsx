import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { trackEvent } from "@/lib/analytics";

const Login = () => {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const confirmed = searchParams.get("confirmed") === "1";
  const reset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    trackEvent("login_submit");
    try {
      await login(email, password);
      trackEvent("login_success");
      navigate(`/${lang}/dashboard`);
    } catch (err) {
      trackEvent("login_failure");
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <main className="auth-main">
      <div className="container flex justify-center px-4">
        <Card variant="static" className="w-full max-w-md border-border shadow-sm motion-safe:animate-card-enter">
          <CardHeader className="space-y-1">
            <CardTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">{t("auth.login_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {confirmed && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {t("auth.email_confirmed_message", {
                  defaultValue: "Email confirmed successfully. You can sign in now.",
                })}
              </div>
            )}
            {reset && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {t("auth.password_reset_success", {
                  defaultValue: "Password updated successfully. You can sign in now.",
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
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "..." : t("auth.login_button")}
              </Button>
            </form>
            <p className="mt-4 text-right text-sm">
              <Link to={`/${lang}/forgot-password`} className="font-medium text-primary hover:underline">
                {t("auth.forgot_password", { defaultValue: "Forgot password?" })}
              </Link>
            </p>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.no_account")}{" "}
              <Link to={`/${lang}/register`} className="font-medium text-primary hover:underline">
                {t("auth.register_button")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Login;
