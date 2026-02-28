import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { CreditCard, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useAuth, type PlanType } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe-client";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { trackEvent } from "@/lib/analytics";
import {
  applyPercentDiscount,
  BASE_PLAN_PRICES,
  fetchDefaultSubscriptionDiscountPercent,
  formatChf,
} from "@/lib/subscription-pricing";

const Subscription = () => {
  const { t } = useTranslation();
  const { user, getToken } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const [searchParams] = useSearchParams();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState(0);
  const autoTriggered = useRef(false);

  const requestedPlan = searchParams.get("plan");

  const handleSubscribe = async (plan: PlanType, promoOverride?: string) => {
    setLoading(true);
    setActionError(null);
    const normalizedPromoCode = (promoOverride ?? promoCode).trim().toUpperCase();
    trackEvent("checkout_start", { plan, hasPromoCode: Boolean(normalizedPromoCode) });
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Session expired. Please sign in again.");
      }
      await createCheckoutSession(plan, token, normalizedPromoCode || undefined);
    } catch (err) {
      console.error("Checkout error:", err);
      trackEvent("checkout_failure", { plan, hasPromoCode: Boolean(normalizedPromoCode) });
      setActionError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setActionError(null);
    trackEvent("billing_portal_open");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Session expired. Please sign in again.");
      }
      await createPortalSession(token);
    } catch (err) {
      console.error("Portal error:", err);
      trackEvent("billing_portal_failure");
      setActionError(err instanceof Error ? err.message : "Portal request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "contractor") return;
    if (autoTriggered.current || loading) return;
    if (user.subscriptionStatus !== "none" && user.subscriptionStatus !== "canceled") return;
    if (requestedPlan !== "basic" && requestedPlan !== "pro") return;
    autoTriggered.current = true;
    void handleSubscribe(requestedPlan, "");
  }, [requestedPlan, user, loading]);
  useEffect(() => {
    void fetchDefaultSubscriptionDiscountPercent().then(setDefaultDiscountPercent).catch(() => setDefaultDiscountPercent(0));
  }, []);

  if (!user || user.role !== "contractor") return null;

  const isActive = user.subscriptionStatus === "active";
  const isPastDue = user.subscriptionStatus === "past_due";
  const isCanceled = user.subscriptionStatus === "canceled";
  const hasNoPlan = user.subscriptionStatus === "none";
  const isAutoCheckoutLoading =
    loading && (requestedPlan === "basic" || requestedPlan === "pro") && (hasNoPlan || isCanceled);

  const offerLimit = user.planType === "basic" ? 10 : null;
  const offerUsage = user.offerCountThisMonth;
  const basicDiscountedPrice =
    defaultDiscountPercent > 0
      ? applyPercentDiscount(BASE_PLAN_PRICES.basic, defaultDiscountPercent)
      : null;
  const proDiscountedPrice =
    defaultDiscountPercent > 0
      ? applyPercentDiscount(BASE_PLAN_PRICES.pro, defaultDiscountPercent)
      : null;

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
      {actionError && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}
      {isAutoCheckoutLoading && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p>{t("subscription.redirecting_to_checkout")}</p>
        </div>
      )}

      {/* Status banner */}
      {isPastDue && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">{t("subscription.payment_failed")}</p>
            <p className="text-xs text-red-600">{t("subscription.update_payment")}</p>
          </div>
          <Button type="button" size="sm" variant="destructive" className="ml-auto" onClick={handleManage} disabled={loading}>
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
              <Button type="button" onClick={() => handleSubscribe("pro")} disabled={loading}>
                {t("subscription.upgrade_to_pro")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleManage} disabled={loading}>
              {t("subscription.manage")}
            </Button>
          </div>
        </div>
      )}

      {/* No subscription — show plans */}
      {(hasNoPlan || isCanceled) && (
        <div className="mt-8">
          <p className="text-muted-foreground">{t("subscription.choose_plan")}</p>
          <div className="mt-4 max-w-sm space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Promo code (optional)</p>
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              disabled={loading}
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Basic Plan */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-xl font-bold text-foreground">
                {t("pricing.basic.name")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("pricing.basic.description")}</p>
              {basicDiscountedPrice !== null ? (
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-accent">-{defaultDiscountPercent}% limited offer</p>
                  <div className="flex items-end gap-2">
                    <span className="text-base font-medium text-muted-foreground line-through">
                      CHF {formatChf(BASE_PLAN_PRICES.basic)}
                    </span>
                    <p className="font-display text-3xl font-bold text-foreground">
                      CHF {formatChf(basicDiscountedPrice)}
                      <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 font-display text-3xl font-bold text-foreground">
                  CHF {BASE_PLAN_PRICES.basic}
                  <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {(t("pricing.basic.features", { returnObjects: true }) as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button type="button" className="mt-6 w-full" variant="outline" onClick={() => handleSubscribe("basic")} disabled={loading}>
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
              {proDiscountedPrice !== null ? (
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-accent">-{defaultDiscountPercent}% limited offer</p>
                  <div className="flex items-end gap-2">
                    <span className="text-base font-medium text-muted-foreground line-through">
                      CHF {formatChf(BASE_PLAN_PRICES.pro)}
                    </span>
                    <p className="font-display text-3xl font-bold text-foreground">
                      CHF {formatChf(proDiscountedPrice)}
                      <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 font-display text-3xl font-bold text-foreground">
                  CHF {BASE_PLAN_PRICES.pro}
                  <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {(t("pricing.pro.features", { returnObjects: true }) as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button type="button" className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSubscribe("pro")} disabled={loading}>
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
