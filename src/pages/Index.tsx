import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Building2, FileText, Shield, Languages, ArrowRight, CheckCircle, Clock, Users, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/i18n-routing";

const Index = () => {
  const { t } = useTranslation();
  const localePath = useLocalePath();

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
    { value: "500+", label: t("stats.projects") },
    { value: "200+", label: t("stats.contractors") },
    { value: "26", label: t("stats.cantons") },
    { value: "98%", label: t("stats.satisfaction") },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-navy" />
        <div className="container relative z-10 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground/80">
              <Shield className="h-3 w-3" />
              {t("hero.trusted")}
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/70 md:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                {t("hero.cta_owner")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t("hero.cta_contractor")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-3xl font-bold text-foreground">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-20">
        <div className="container">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">{t("features.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("features.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
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

      {/* How It Works */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">{t("howItWorks.title")}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="font-display text-xs font-bold tracking-wider text-accent">{s.num}</span>
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
      <section className="bg-background py-20">
        <div className="container">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">{t("pricing.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("pricing.subtitle")}</p>
            <p className="mt-1 text-sm font-medium text-accent">{t("pricing.free_owner")}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(["basic", "pro", "enterprise"] as const).map((plan, i) => {
              const isPopular = plan === "pro";
              return (
                <motion.div
                  key={plan}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-lg border p-6 ${
                    isPopular
                      ? "border-accent bg-card shadow-elevated"
                      : "border-border bg-card shadow-card"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                      {t("pricing.popular")}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {t(`pricing.${plan}.name`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.${plan}.description`)}</p>
                  <div className="mt-4">
                    {plan !== "enterprise" ? (
                      <span className="font-display text-3xl font-bold text-foreground">
                        CHF {t(`pricing.${plan}.price`)}
                        <span className="text-base font-normal text-muted-foreground">{t("pricing.monthly")}</span>
                      </span>
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
                      isPopular
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : plan === "enterprise"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                    }`}
                    variant={!isPopular && plan !== "enterprise" ? "outline" : "default"}
                    asChild
                  >
                    <Link to={localePath("/pricing")}>
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
      <section className="bg-primary py-16">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground">{t("cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/70">{t("cta.subtitle")}</p>
            <Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              {t("cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Index;
