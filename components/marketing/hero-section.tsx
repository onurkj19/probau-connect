import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/common/section";
import { Link } from "@/i18n/navigation";

export const HeroSection = () => {
  const tLanding = useTranslations("landing.hero");
  const tCommon = useTranslations("common.actions");

  return (
    <Section className="relative overflow-hidden border-b border-neutral-200 bg-white" centered>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-swiss-red">
          {tLanding("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-900 md:text-6xl">
          {tLanding("title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-neutral-600 md:text-lg">
          {tLanding("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">{tCommon("postProjectFree")}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/unternehmer/projects">{tCommon("browseProjects")}</Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
          {[
            { label: tLanding("metrics.cantons"), value: "26" },
            { label: tLanding("metrics.tenders"), value: "1,250+" },
            { label: tLanding("metrics.contractors"), value: "760+" },
            { label: tLanding("metrics.responseTime"), value: "<24h" }
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xl font-bold text-brand-900">{metric.value}</p>
              <p className="mt-1 text-xs text-neutral-600">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
