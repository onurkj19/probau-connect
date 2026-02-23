import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { FileText, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";

const DashboardOffers = () => {
  const { t } = useTranslation();
  const { user, offerLimit } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const isActive = user?.subscriptionStatus === "active";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.my_offers")}</h1>

      {isActive && user?.planType && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatsCard
            title={t("subscription.offers_used")}
            value={offerLimit ? `${user.offerCountThisMonth} / ${offerLimit}` : `${user.offerCountThisMonth}`}
            icon={CreditCard}
            description={offerLimit ? t("subscription.basic_limit") : t("subscription.unlimited")}
          />
          <StatsCard
            title={t("dashboard.subscription")}
            value={t(`pricing.${user.planType}.name`)}
            icon={FileText}
          />
        </div>
      )}

      {!isActive && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm font-medium text-yellow-800">{t("dashboard.subscription_required_message")}</p>
          <Button size="sm" className="mt-2" asChild>
            <Link to={`/${lang}/dashboard/subscription`}>{t("dashboard.upgrade_now")}</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">
          {t("dashboard.pending_offers")}: 0
        </p>
      </div>
    </div>
  );
};

export default DashboardOffers;
