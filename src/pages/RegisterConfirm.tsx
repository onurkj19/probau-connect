import { useTranslation } from "react-i18next";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const RegisterConfirm = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const email = searchParams.get("email") ?? "";

  return (
    <main className="auth-main">
      <div className="container flex justify-center px-4">
        <Card variant="static" className="w-full max-w-md border-border shadow-sm motion-safe:animate-card-enter">
          <CardHeader>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <CardTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {t("auth.email_confirm_title", { defaultValue: "Confirm your email" })}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("auth.email_confirm_sent", {
                defaultValue:
                  "We sent a confirmation link to your email. Please open it to activate your account.",
              })}
            </p>
            {email ? (
              <p className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-foreground">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {t("auth.email_confirm_note", {
                defaultValue:
                  "After confirmation, return to login and sign in. If you do not see the email, check spam.",
              })}
            </p>
            <Button className="w-full" asChild>
              <Link to={`/${lang}/login`}>
                {t("auth.back_to_login", { defaultValue: "Back to login" })}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default RegisterConfirm;
