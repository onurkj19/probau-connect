import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const { t } = useTranslation();
  const { updatePassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const initRecoverySession = async () => {
      // Supabase recovery links typically include tokens in URL hash.
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
      if (active) setReady(true);
    };
    void initRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("auth.password_mismatch"));
      return;
    }
    try {
      await updatePassword(password);
      navigate(`/${lang}/login?reset=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

  return (
    <main className="bg-background py-20">
      <div className="container flex justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("auth.reset_password_title", { defaultValue: "Reset password" })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.reset_password_description", {
              defaultValue: "Set your new password to recover your account.",
            })}
          </p>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!ready}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("auth.confirm_password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!ready}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !ready}>
              {isLoading
                ? "..."
                : t("auth.reset_password_button", { defaultValue: "Update password" })}
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

export default ResetPassword;
