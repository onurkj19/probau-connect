import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle2, Loader2 } from "lucide-react";

const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const Register = () => {
  const { t } = useTranslation();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [role, setRole] = useState<UserRole>("project_owner");
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(t("auth.password_strength_error"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.password_mismatch"));
      return;
    }
    if (!acceptedTerms) {
      setError(t("auth.terms_accept_required"));
      return;
    }
    setSubmitState("submitting");
    trackEvent("register_submit", { role });
    try {
      await register({
        email,
        password,
        name,
        companyName,
        vatNumber,
        profileTitle,
        avatarFile,
        role,
      });
      trackEvent("register_success", { role });
      setSubmitState("success");
      setTimeout(() => {
        navigate(`/${lang}/login`);
      }, 900);
    } catch (err) {
      trackEvent("register_failure", { role });
      setSubmitState("idle");
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <main className="bg-background py-20">
      <div className="container flex justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-foreground">{t("auth.register_title")}</h1>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.full_name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{t("auth.company_name")}</Label>
              <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat-number">{t("auth.vat_number")}</Label>
              <Input
                id="vat-number"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder={t("auth.vat_number_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-title">{t("auth.profile_title")}</Label>
              <Input
                id="profile-title"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                placeholder={t("auth.profile_title_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar-file">{t("auth.profile_photo_upload")}</Label>
              <Input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">{t("auth.profile_photo_hint")}</p>
              {avatarFile && <p className="text-xs text-foreground">{avatarFile.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">{t("auth.password_requirements")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("auth.confirm_password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.role_select")}</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={role === "project_owner" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setRole("project_owner")}
                >
                  {t("auth.role_owner")}
                </Button>
                <Button
                  type="button"
                  variant={role === "contractor" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setRole("contractor")}
                >
                  {t("auth.role_contractor")}
                </Button>
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-input"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
              />
              <span>
                {t("auth.terms_accept_label")}{" "}
                <Link to={`/${lang}/terms`} className="font-medium text-primary hover:underline">
                  {t("nav.terms")}
                </Link>
                .
              </span>
            </label>
            <Button type="submit" className="w-full gap-2" disabled={isLoading || submitState !== "idle"}>
              {submitState === "submitting" || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("auth.processing")}
                </>
              ) : submitState === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 animate-bounce" />
                  {t("auth.done")}
                </>
              ) : (
                t("auth.register_button")
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.has_account")}{" "}
            <Link to={`/${lang}/login`} className="font-medium text-primary hover:underline">
              {t("auth.login_button")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
