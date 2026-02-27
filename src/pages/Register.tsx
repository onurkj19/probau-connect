import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const Register = () => {
  const { t } = useTranslation();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState<UserRole>("project_owner");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({
        email,
        password,
        name,
        companyName,
        profileTitle,
        avatarUrl,
        role,
      });
      navigate(`/${lang}/dashboard`);
    } catch (err) {
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
              <Label htmlFor="profile-title">{t("auth.profile_title")}</Label>
              <Input
                id="profile-title"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                placeholder={t("auth.profile_title_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar-url">{t("auth.profile_photo_url")}</Label>
              <Input
                id="avatar-url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">{t("auth.profile_photo_hint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "..." : t("auth.register_button")}
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
