import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Building2, FileText, Shield, Languages, ArrowRight, CheckCircle, Clock, Users, MapPin, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { TrendingProjectCardSkeleton } from "@/components/common/TrendingProjectCardSkeleton";
import { useLocalePath } from "@/lib/i18n-routing";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/time";
import { trackEvent } from "@/lib/analytics";
import {
  applyPercentDiscount,
  fetchStripePlanPrices,
  fetchSubscriptionPricingConfig,
  formatChf,
  getOfferDescription,
  getOfferValidUntil,
  getPlanPrice,
  getYearlySavingsPercent,
  type BillingCycle,
  type StripePlanPrices,
  type SubscriptionPricingConfig,
} from "@/lib/subscription-pricing";

interface TrendingProject {
  id: string;
  title: string;
  address: string;
  category: string;
  custom_category: string | null;
  created_at: string;
}

interface PlatformStatsResponse {
  totalProjects: number;
  totalContractors: number;
}

const Index = () => {
  const { t, i18n } = useTranslation();
  const localePath = useLocalePath();
  const { user } = useAuth();
  const [trendingProjects, setTrendingProjects] = useState<TrendingProject[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [pricingConfig, setPricingConfig] = useState<SubscriptionPricingConfig | null>(null);
  const [stripePrices, setStripePrices] = useState<StripePlanPrices | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStatsResponse | null>(null);

  const contractorPrimaryPath = user
    ? user.role === "contractor"
      ? localePath("/dashboard/subscription")
      : localePath("/dashboard")
    : localePath("/register");

  const ownerPrimaryPath = user ? localePath("/dashboard/projects") : localePath("/register");

  const getPlanTarget = (plan: "basic" | "pro" | "enterprise") => {
    if (!user) return localePath("/register");
    if (user.role === "contractor" && plan !== "enterprise") {
      return localePath(`/dashboard/subscription?plan=${plan}&cycle=${billingCycle}`);
    }
    if (user.role === "contractor") return localePath(`/dashboard/subscription?cycle=${billingCycle}`);
    return localePath("/dashboard/projects");
  };

  const features = [
    { icon: FileText, title: t("features.free_posting.title"), desc: t("features.free_posting.description") },
    { icon: Users, title: t("features.qualified.title"), desc: t("features.qualified.description") },
    { icon: Shield, title: t("features.secure.title"), desc: t("features.secure.description") },
    { icon: Languages, title: t("features.multilingual.title"), desc: t("features.multilingual.description") },
  ];

  const steps = [
    { num: "01", icon: Building2, title: t("howItWorks.step1.title"), desc: t("howItWorks.step1.description") },
    { num: "02", icon: FileText, title: t("howItWorks.step2.title"), desc: t("howItWorks.step2.description") },
    { num: "03", icon: CheckCircle, title: t("howItWorks.step3.title"), desc: t("howItWorks.step3.description") },
  ];

  const stats = [
    {
      value: platformStats
        ? `+${platformStats.totalProjects.toLocaleString(i18n.language)}`
        : "—",
      label: t("stats.projects"),
    },
    {
      value: platformStats
        ? `+${platformStats.totalContractors.toLocaleString(i18n.language)}`
        : "—",
      label: t("stats.contractors"),
    },
    { value: "26", label: t("stats.cantons") },
    { value: "98%", label: t("stats.satisfaction") },
  ];

  useEffect(() => {
    let canceled = false;
    const loadTrending = async () => {
      await supabase.rpc("cleanup_expired_projects");
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("projects")
        .select("id, title, address, category, custom_category, created_at")
        .eq("status", "active")
        .gt("deadline", nowIso)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!canceled) {
        setTrendingProjects((data ?? []) as TrendingProject[]);
        setLoadingTrending(false);
      }
    };

    void loadTrending();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    const loadPlatformStats = async () => {
      try {
        const response = await fetch("/api/public?scope=platform-stats");
        if (!response.ok) return;
        const data = (await response.json()) as PlatformStatsResponse;
        if (!canceled) setPlatformStats(data);
      } catch {
        // Keep fallback placeholder values on fetch failure.
      }
    };

    void loadPlatformStats();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    void Promise.all([fetchSubscriptionPricingConfig(), fetchStripePlanPrices()])
      .then(([config, prices]) => {
        setPricingConfig(config);
        setStripePrices(prices);
      })
      .catch(() => {
        setPricingConfig(null);
        setStripePrices(null);
      });
  }, []);
  const monthlyDiscountPercent =
    pricingConfig?.monthly.enabled && (!pricingConfig.monthly.validUntil || new Date(pricingConfig.monthly.validUntil).getTime() > Date.now())
      ? pricingConfig.monthly.percentOff
      : 0;
  const yearlyDiscountPercent =
    pricingConfig?.yearly.enabled && (!pricingConfig.yearly.validUntil || new Date(pricingConfig.yearly.validUntil).getTime() > Date.now())
      ? Number(((pricingConfig.yearly.freeMonths / 12) * 100).toFixed(2))
      : 0;
  const activeDiscountPercent = billingCycle === "yearly" ? yearlyDiscountPercent : monthlyDiscountPercent;
  const activeDescription = pricingConfig ? getOfferDescription(pricingConfig, billingCycle) : "";
  const activeValidUntil = pricingConfig ? getOfferValidUntil(pricingConfig, billingCycle) : null;
  const monthlyToggleLabel = t("pricing.monthly_toggle", { defaultValue: "Monthly" });
  const yearlyToggleLabel = t("pricing.yearly_toggle", { defaultValue: "Yearly" });
  const monthlySuffix = t("pricing.monthly", { defaultValue: "/month" });
  const yearlySuffix = t("pricing.yearly", { defaultValue: "/year" });

  return (
    <main>
      {/* Hero — full-bleed background image at full opacity */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-100"
          style={{ backgroundImage: "url('/hero-banner.png')" }}
          aria-hidden
        />
        <div className="relative z-10 container section-y">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-2xl"
            >
              <div className="rounded-2xl border border-border/60 bg-background/55 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 sm:p-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/65 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur-md">
                  <Shield className="h-3 w-3" />
                  {t("hero.trusted")}
                </div>
                <h1 className="font-display text-4xl font-bold leading-tight text-foreground drop-shadow-sm md:text-5xl lg:text-6xl">
                  {t("hero.title")}
                </h1>
                <p className="mt-4 max-w-xl text-lg text-foreground/85 md:text-xl">
                  {t("hero.subtitle")}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="gap-2 shadow-md" asChild>
                    <Link
                      to={ownerPrimaryPath}
                      onClick={() => trackEvent("cta_owner_click", { location: "hero", authenticated: Boolean(user) })}
                    >
                      {t("hero.cta_owner")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border/80 bg-background/50 backdrop-blur-sm hover:bg-background/70"
                    asChild
                  >
                    <Link
                      to={contractorPrimaryPath}
                      onClick={() => trackEvent("cta_contractor_click", { location: "hero", authenticated: Boolean(user) })}
                    >
                      {t("hero.cta_contractor")}
                    </Link>
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-foreground/80">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 backdrop-blur-md">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {t("home.trending_subtitle")}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 backdrop-blur-md">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    {t("pricing.free_owner")}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06, ease: [0.4, 0, 0.2, 1] }}
              className="hidden md:block"
            >
              <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur-2xl transition-all duration-200 supports-[backdrop-filter]:bg-card/40 motion-safe:hover:shadow-2xl">
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="rounded-xl border border-border/50 bg-background/45 p-4 backdrop-blur-md"
                    >
                      <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="mt-1 text-xs text-foreground/75">{s.label}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-4 backdrop-blur-md">
                  <p className="text-sm font-semibold text-foreground">{t("features.secure.title")}</p>
                  <div className="mt-3 space-y-2 text-sm text-foreground/80">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {t("footer.location")}
                    </p>
                    <p className="flex items-center gap-2">
                      <Lock className="h-4 w-4 shrink-0" />
                      {t("features.secure.description")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-20 -mt-8">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-primary/20 bg-card/95 p-6 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/80 md:grid-cols-4 md:gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="card-nested bg-background px-3 py-4 text-center"
              >
                <div className="font-display text-2xl font-bold text-foreground md:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("home.stats_transparency_note", {
              defaultValue: "Live platform counters. ProjektMarkt is newly launched and growing continuously.",
            })}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background section-y">
        <div className="container">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="page-title">{t("features.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">{t("features.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="app-card app-card--interactive"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending now */}
      <section className="border-t border-border bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="page-title">{t("home.trending_title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.trending_subtitle")}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={localePath("/projects")}>{t("home.trending_view_all")}</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {loadingTrending && <TrendingProjectCardSkeleton count={3} />}
            {!loadingTrending && trendingProjects.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={Sparkles}
                  title={t("projects.no_projects")}
                  description={t("home.trending_subtitle")}
                  size="compact"
                  className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-10 md:py-12"
                />
              </div>
            )}
            {!loadingTrending &&
              trendingProjects.map((project) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="app-card app-card--interactive group relative overflow-hidden"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="inline-flex max-w-[70%] truncate rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {(project.custom_category || project.category)
                          .replace(/[_-]/g, " ")
                          .replace(/\b\w/g, (ch) => ch.toUpperCase())}
                      </p>
                      {Date.now() - new Date(project.created_at).getTime() <= 24 * 60 * 60 * 1000 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          New
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(project.created_at, i18n.language)}
                    </span>
                  </div>

                  <div className="relative mt-3">
                    <h3 className={`line-clamp-2 font-display text-lg font-semibold leading-tight text-foreground ${!user ? "blur-[2px] select-none" : ""}`}>
                      {project.title}
                    </h3>
                    {!user && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/50 to-card/90" />
                    )}
                  </div>

                  <div className="relative mt-2">
                    <p className={`flex items-center gap-1.5 line-clamp-1 text-sm text-muted-foreground ${!user ? "blur-[2px] select-none" : ""}`}>
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {project.address}
                    </p>
                    {!user && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/40 to-card/90" />
                    )}
                  </div>

                  <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {!user ? <Lock className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-primary" />}
                      {!user
                        ? "Details are blurred for guests. Register to unlock full project details."
                        : "Contact details stay protected and are shared through the secure offer flow."}
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                    <Link
                      to={user ? localePath("/dashboard/projects") : localePath("/register")}
                      onClick={() =>
                        trackEvent("trending_card_cta_click", {
                          project_id: project.id,
                          authenticated: Boolean(user),
                        })}
                    >
                      {user ? "Open in dashboard" : "Register to apply"}
                    </Link>
                  </Button>
                </motion.article>
              ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-muted/30 section-y">
        <div className="container">
          <h2 className="page-title text-center">{t("howItWorks.title")}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="font-display text-xs font-bold tracking-wider text-muted-foreground">{s.num}</span>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-7 hidden h-px w-1/3 bg-border md:block" style={{ right: "-16.66%" }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-background py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">{t("pricing.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">{t("pricing.subtitle")}</p>
            <p className="mt-1 text-sm font-medium text-primary">{t("pricing.free_owner")}</p>
            <div className="mt-4 inline-flex rounded-lg border border-border bg-muted/40 p-1">
              <Button
                type="button"
                size="sm"
                variant={billingCycle === "monthly" ? "default" : "ghost"}
                onClick={() => setBillingCycle("monthly")}
              >
                {monthlyToggleLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={billingCycle === "yearly" ? "default" : "ghost"}
                onClick={() => setBillingCycle("yearly")}
              >
                {yearlyToggleLabel}
              </Button>
            </div>
            {activeDiscountPercent > 0 && (
              <p className="mt-2 text-sm text-primary">
                {activeDescription || `-${activeDiscountPercent}% limited offer`}
                {activeValidUntil ? ` · valid until ${new Date(activeValidUntil).toLocaleDateString(i18n.language)}` : ""}
              </p>
            )}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(["basic", "pro", "enterprise"] as const).map((plan, i) => {
              const isPopular = plan === "pro";
              const isSubscriptionPlan = plan === "basic" || plan === "pro";
              const basePrice = isSubscriptionPlan ? getPlanPrice(plan, billingCycle, stripePrices) : null;
              const discountedPrice =
                basePrice !== null && activeDiscountPercent > 0
                  ? applyPercentDiscount(basePrice, activeDiscountPercent)
                  : null;
              const finalPrice = discountedPrice ?? basePrice;
              const yearlySavingsPercent =
                isSubscriptionPlan && billingCycle === "yearly" && finalPrice !== null
                  ? getYearlySavingsPercent(plan, finalPrice, stripePrices)
                  : 0;
              return (
                <motion.div
                  key={plan}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className={`relative rounded-2xl border p-6 shadow-sm transition-all duration-200 ease-smooth hover:shadow-md hover:scale-[1.01] hover:opacity-[0.99] ${
                    isPopular ? "border-primary bg-card ring-1 ring-primary/20" : "border-border bg-card"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      {t("pricing.popular")}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {t(`pricing.${plan}.name`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.${plan}.description`)}</p>
                  <div className="mt-4">
                    {plan !== "enterprise" ? (
                      discountedPrice !== null ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-primary">
                            {activeDescription || `-${activeDiscountPercent}% limited offer`}
                          </p>
                          <div className="flex items-end gap-2">
                            <span className="text-base font-medium text-muted-foreground line-through">
                              CHF {formatChf(basePrice)}
                            </span>
                            <span className="font-display text-3xl font-bold text-foreground">
                              CHF {formatChf(discountedPrice)}
                              <span className="text-base font-normal text-muted-foreground">
                                {billingCycle === "yearly" ? yearlySuffix : monthlySuffix}
                              </span>
                            </span>
                          </div>
                          {yearlySavingsPercent > 0 && billingCycle === "yearly" && (
                            <p className="text-xs font-medium text-primary">
                              Save {yearlySavingsPercent}% vs paying monthly for 12 months
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-display text-3xl font-bold text-foreground">
                            CHF {formatChf(basePrice)}
                            <span className="text-base font-normal text-muted-foreground">
                              {billingCycle === "yearly" ? yearlySuffix : monthlySuffix}
                            </span>
                          </span>
                          {yearlySavingsPercent > 0 && billingCycle === "yearly" && (
                            <p className="text-xs font-medium text-primary">
                              Save {yearlySavingsPercent}% vs paying monthly for 12 months
                            </p>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="font-display text-xl font-bold text-foreground">{t(`pricing.${plan}.price`)}</span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-2">
                    {(t(`pricing.${plan}.features`, { returnObjects: true }) as string[]).map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={!isPopular && plan !== "enterprise" ? "outline" : "default"}
                    asChild
                  >
                    <Link to={getPlanTarget(plan)}>
                      {plan === "enterprise" ? t("pricing.contact") : t("pricing.cta")}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary section-y">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className="font-display text-2xl font-semibold text-primary-foreground md:text-3xl">{t("cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/80 md:text-base">{t("cta.subtitle")}</p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 gap-2 bg-background text-primary shadow-sm hover:bg-muted"
              asChild
            >
              <Link to={contractorPrimaryPath} className="inline-flex items-center gap-2">
                {t("cta.button")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Index;
