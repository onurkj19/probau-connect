import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const Unauthorized = () => {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <main className="bg-background section-y">
      <div className="container flex flex-col items-center justify-center px-4 text-center">
        <ShieldX className="h-16 w-16 text-destructive" />
        <h1 className="page-title mt-6">{t("auth.unauthorized")}</h1>
        <p className="mt-2 text-muted-foreground">{t("auth.unauthorized_message")}</p>
        <Button asChild className="mt-6">
          <Link to={`/${lang}`}>{t("notFound.back")}</Link>
        </Button>
      </div>
    </main>
  );
};

export default Unauthorized;
