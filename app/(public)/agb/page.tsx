import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {};

const AgbPage = async () => {
  const t = await getTranslations("legal.agb");

  return (
    <section className="bg-white py-16">
      <div className="container max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold text-brand-900">{t("title")}</h1>
        <p className="text-neutral-600">{t("intro")}</p>
        <h2 className="text-xl font-semibold text-brand-900">{t("scopeTitle")}</h2>
        <p className="text-neutral-600">{t("scopeText")}</p>
        <h2 className="text-xl font-semibold text-brand-900">{t("subscriptionsTitle")}</h2>
        <p className="text-neutral-600">{t("subscriptionsText")}</p>
        <h2 className="text-xl font-semibold text-brand-900">{t("liabilityTitle")}</h2>
        <p className="text-neutral-600">{t("liabilityText")}</p>
      </div>
    </section>
  );
};

export default AgbPage;
