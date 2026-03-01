import { useTranslation } from "react-i18next";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const RegisterConfirm = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const email = searchParams.get("email") ?? "";

  return (
    <main className="bg-background py-20">
      <div className="container flex justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("auth.email_confirm_title", { defaultValue: "Confirm your email" })}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("auth.email_confirm_sent", {
              defaultValue:
                "We sent a confirmation link to your email. Please open it to activate your account.",
            })}
          </p>
          {email && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {t("auth.email_confirm_note", {
              defaultValue:
                "After confirmation, return to login and sign in. If you do not see the email, check spam.",
            })}
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link to={`/${lang}/login`}>
              {t("auth.back_to_login", { defaultValue: "Back to login" })}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default RegisterConfirm;
