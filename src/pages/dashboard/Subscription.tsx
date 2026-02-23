import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { CreditCard, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useAuth, type PlanType } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe-client";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";

const Subscription = () => {
  const { t } = useTranslation();
  const { user, getToken } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== "contractor") return null;

  const isActive = user.subscriptionStatus === "active";
  const isPastDue = user.subscriptionStatus === "past_due";
  const isCanceled = user.subscriptionStatus === "canceled";
  const hasNoPlan = user.subscriptionStatus === "none";

  const offerLimit = user.planType === "basic" ? 10 : null;
  const offerUsage = user.offerCountThisMonth;

  const handleSubscribe = async (plan: PlanType) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await createCheckoutSession(plan, token);
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      await createPortalSession(token);
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renewalDate = user.subscriptionCurrentPeriodEnd
    ? new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString(lang, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        {t("subscription.title")}
      </h1>

      {/* Status banner */}
      {isPastDue && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">{t("subscription.payment_failed")}</p>
            <p className="text-xs text-red-600">{t("subscription.update_payment")}</p>
          </div>
          <Button size="sm" variant="destructive" className="ml-auto" onClick={handleManage}>
            {t("subscription.update_payment_button")}
          </Button>
        </div>
      )}

      {isCanceled && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <XCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800">{t("subscription.canceled_info")}</p>
        </div>
      )}

      {/* Active subscription details */}
      {isActive && user.planType && (
        <div className="mt-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-display text-lg font-bold text-green-900">
                  {t(`pricing.${user.planType}.name`)} — CHF {user.planType === "basic" ? "79" : "149"}{t("pricing.monthly")}
                </p>
                {renewalDate && (
                  <p className="text-sm text-green-700">
                    {t("subscription.renews_on")}: {renewalDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <StatsCard
              title={t("subscription.offers_used")}
              value={offerLimit ? `${offerUsage} / ${offerLimit}` : `${offerUsage}`}
              icon={CreditCard}
              description={offerLimit ? t("subscription.basic_limit") : t("subscription.unlimited")}
            />
          </div>

          <div className="mt-6 flex gap-3">
            {user.planType === "basic" && (
              <Button onClick={() => handleSubscribe("pro")}>
                {t("subscription.upgrade_to_pro")}
              </Button>
            )}
            <Button variant="outline" onClick={handleManage}>
              {t("subscription.manage")}
            </Button>
          </div>
        </div>
      )}

      {/* No subscription — show plans */}
      {(hasNoPlan || isCanceled) && (
        <div className="mt-8">
          <p className="text-muted-foreground">{t("subscription.choose_plan")}</p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Basic Plan */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-xl font-bold text-foreground">
                {t("pricing.basic.name")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("pricing.basic.description")}</p>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">
                CHF 79<span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {(t("pricing.basic.features", { returnObjects: true }) as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant="outline" onClick={() => handleSubscribe("basic")}>
                {t("pricing.cta")}
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-lg border-2 border-accent bg-card p-6 shadow-elevated">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                {t("pricing.popular")}
              </span>
              <h3 className="font-display text-xl font-bold text-foreground">
                {t("pricing.pro.name")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("pricing.pro.description")}</p>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">
                CHF 149<span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {(t("pricing.pro.features", { returnObjects: true }) as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSubscribe("pro")}>
                {t("pricing.cta")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
