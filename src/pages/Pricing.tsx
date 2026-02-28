import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useState } from "react";
import {
  applyPercentDiscount,
  BASE_PLAN_PRICES,
  fetchDefaultSubscriptionDiscountPercent,
  formatChf,
} from "@/lib/subscription-pricing";

const Pricing = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState(0);
  useEffect(() => {
    void fetchDefaultSubscriptionDiscountPercent().then(setDefaultDiscountPercent).catch(() => setDefaultDiscountPercent(0));
  }, []);

  const plans = ["basic", "pro", "enterprise"] as const;

  return (
    <main className="bg-background py-20">
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-4xl font-bold text-foreground">{t("pricing.title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
          <p className="mt-1 text-sm font-medium text-accent">{t("pricing.free_owner")}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const isPopular = plan === "pro";
            const isSubscriptionPlan = plan === "basic" || plan === "pro";
            const basePrice = isSubscriptionPlan ? BASE_PLAN_PRICES[plan] : null;
            const discountedPrice =
              basePrice !== null && defaultDiscountPercent > 0
                ? applyPercentDiscount(basePrice, defaultDiscountPercent)
                : null;
            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-lg border p-6 ${
                  isPopular ? "border-accent bg-card shadow-elevated" : "border-border bg-card shadow-card"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                    {t("pricing.popular")}
                  </span>
                )}
                <h2 className="font-display text-lg font-semibold text-foreground">{t(`pricing.${plan}.name`)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.${plan}.description`)}</p>
                <div className="mt-4">
                  {plan !== "enterprise" ? (
                    discountedPrice !== null ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-accent">-{defaultDiscountPercent}% limited offer</p>
                        <div className="flex items-end gap-2">
                          <span className="text-base font-medium text-muted-foreground line-through">
                            CHF {formatChf(basePrice)}
                          </span>
                          <span className="font-display text-3xl font-bold text-foreground">
                            CHF {formatChf(discountedPrice)}
                            <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="font-display text-3xl font-bold text-foreground">
                        CHF {basePrice}
                        <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                      </span>
                    )
                  ) : (
                    <span className="font-display text-xl font-bold text-foreground">{t(`pricing.${plan}.price`)}</span>
                  )}
                </div>
                <ul className="mt-6 space-y-2">
                  {(t(`pricing.${plan}.features`, { returnObjects: true }) as string[]).map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full ${
                    isPopular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""
                  }`}
                  variant={isPopular ? "default" : "outline"}
                  asChild
                >
                  {user ? (
                    <Link
                      to={`/${lang}/dashboard/subscription`}
                      onClick={() => trackEvent("pricing_cta_click", { plan, authenticated: true })}
                    >
                      {plan === "enterprise" ? t("pricing.contact") : t("pricing.cta")}
                    </Link>
                  ) : (
                    <Link
                      to={`/${lang}/register`}
                      onClick={() => trackEvent("pricing_cta_click", { plan, authenticated: false })}
                    >
                      {plan === "enterprise" ? t("pricing.contact") : t("pricing.cta")}
                    </Link>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default Pricing;
