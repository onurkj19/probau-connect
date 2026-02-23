import { useTranslations } from "next-intl";

import { Section } from "@/components/common/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export const PricingPreviewSection = () => {
  const t = useTranslations("landing.pricingPreview");
  const tCommon = useTranslations("common.actions");

  return (
    <Section
      className="bg-neutral-50"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-brand-900">{t("basic.title")}</p>
          <p className="mt-3 text-4xl font-bold text-brand-900">{t("basic.price")}</p>
          <p className="text-sm text-neutral-500">{t("basic.period")}</p>
          <ul className="mt-5 space-y-2 text-sm text-neutral-600">
            <li>{t("basic.feature1")}</li>
            <li>{t("basic.feature2")}</li>
            <li>{t("basic.feature3")}</li>
          </ul>
        </Card>

        <Card className="border-brand-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-900">{t("pro.title")}</p>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">
              {t("pro.badge")}
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold text-brand-900">{t("pro.price")}</p>
          <p className="text-sm text-neutral-500">{t("pro.period")}</p>
          <ul className="mt-5 space-y-2 text-sm text-neutral-600">
            <li>{t("pro.feature1")}</li>
            <li>{t("pro.feature2")}</li>
            <li>{t("pro.feature3")}</li>
          </ul>
        </Card>
      </div>

      <div className="mt-8">
        <Button asChild variant="secondary" size="lg">
          <Link href="/pricing">{tCommon("viewFullPricing")}</Link>
        </Button>
      </div>
    </Section>
  );
};
