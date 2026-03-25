import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type UserRole } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const PASSWORD_RULES = {
  minLength: (value: string) => value.length >= 8,
  uppercase: (value: string) => /[A-Z]/.test(value),
  number: (value: string) => /\d/.test(value),
  symbol: (value: string) => /[^A-Za-z0-9]/.test(value),
};

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
  const passwordChecks = {
    minLength: PASSWORD_RULES.minLength(password),
    uppercase: PASSWORD_RULES.uppercase(password),
    number: PASSWORD_RULES.number(password),
    symbol: PASSWORD_RULES.symbol(password),
  };
  const passwordStrengthScore = (() => {
    if (!password) return 0;
    let score = 0;
    if (passwordChecks.minLength) score += 1;
    if (passwordChecks.uppercase) score += 1;
    if (passwordChecks.number) score += 1;
    if (passwordChecks.symbol) score += 1;
    if (password.length >= 12) score += 1;
    return Math.min(4, score);
  })();
  const passwordStrength = (() => {
    if (passwordStrengthScore <= 2) {
      return {
        label: t("auth.password_strength_weak", { defaultValue: "Weak" }),
        className: "text-red-600",
        barClassName: "bg-red-500",
      };
    }
    if (passwordStrengthScore === 3) {
      return {
        label: t("auth.password_strength_medium", { defaultValue: "Medium" }),
        className: "text-amber-600",
        barClassName: "bg-amber-500",
      };
    }
    return {
      label: t("auth.password_strength_strong", { defaultValue: "Strong" }),
      className: "text-emerald-600",
      barClassName: "bg-emerald-500",
    };
  })();
  const isStrongPassword = Object.values(passwordChecks).every(Boolean);
  const hasConfirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isStrongPassword) {
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
        emailRedirectTo: `${window.location.origin}/${lang}/login?confirmed=1`,
        preferredLocale: lang,
      });
      trackEvent("register_success", { role });
      setSubmitState("success");
      navigate(`/${lang}/register/confirm?email=${encodeURIComponent(email)}`);
    } catch (err) {
      trackEvent("register_failure", { role });
      setSubmitState("idle");
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <main className="auth-main">
      <div className="container flex justify-center px-4">
        <Card variant="static" className="w-full max-w-lg border-border shadow-sm motion-safe:animate-card-enter">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-semibold tracking-tight">{t("auth.register_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("auth.full_name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">{t("auth.company_name")}</Label>
              <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vat-number">{t("auth.vat_number")}</Label>
              <Input
                id="vat-number"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder={t("auth.vat_number_placeholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-title">{t("auth.profile_title")}</Label>
              <Input
                id="profile-title"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                placeholder={t("auth.profile_title_placeholder")}
              />
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">{t("auth.password_requirements")}</p>
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.barClassName}`}
                    style={{ width: `${(passwordStrengthScore / 4) * 100}%` }}
                  />
                </div>
                <p className={`text-xs font-medium ${passwordStrength.className}`}>
                  {t("auth.password_strength_label", { defaultValue: "Password strength" })}: {passwordStrength.label}
                </p>
              </div>
              <div className="space-y-1 text-xs">
                <p className={passwordChecks.minLength ? "text-emerald-600" : "text-muted-foreground"}>
                  {passwordChecks.minLength ? "✓" : "•"} {t("auth.password_req_min", { defaultValue: "At least 8 characters" })}
                </p>
                <p className={passwordChecks.uppercase ? "text-emerald-600" : "text-muted-foreground"}>
                  {passwordChecks.uppercase ? "✓" : "•"} {t("auth.password_req_upper", { defaultValue: "At least 1 uppercase letter" })}
                </p>
                <p className={passwordChecks.number ? "text-emerald-600" : "text-muted-foreground"}>
                  {passwordChecks.number ? "✓" : "•"} {t("auth.password_req_number", { defaultValue: "At least 1 number" })}
                </p>
                <p className={passwordChecks.symbol ? "text-emerald-600" : "text-muted-foreground"}>
                  {passwordChecks.symbol ? "✓" : "•"} {t("auth.password_req_symbol", { defaultValue: "At least 1 symbol" })}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t("auth.confirm_password")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {hasConfirmMismatch && (
                <p className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {t("auth.password_mismatch")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
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
                className="mt-0.5 h-4 w-4 rounded border border-gray-300/50 bg-white/70 shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 supports-[backdrop-filter]:bg-white/60"
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
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200" />
                  {t("auth.done")}
                </>
              ) : (
                t("auth.register_button")
              )}
            </Button>
          </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.has_account")}{" "}
              <Link to={`/${lang}/login`} className="font-medium text-primary hover:underline">
                {t("auth.login_button")}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              <Link to={`/${lang}/forgot-password`} className="font-medium text-primary hover:underline">
                {t("auth.forgot_password", { defaultValue: "Forgot password?" })}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Register;
