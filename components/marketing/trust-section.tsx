import { useTranslations } from "next-intl";

import { Section } from "@/components/common/section";

export const TrustSection = () => {
  const t = useTranslations("landing.trust");

  return (
    <Section className="bg-white" centered>
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-swiss-red">{t("eyebrow")}</p>
        <h2 className="mt-2 text-3xl font-bold text-brand-900 lg:text-4xl">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-600">{t("description")}</p>

        <div className="mt-8 border-t border-neutral-200 pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {t("logosPlaceholder")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                aria-label={t("logoLabel", { index })}
                className="flex h-14 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-500"
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};
