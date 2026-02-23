import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {};

const PrivacyPage = async () => {
  const t = await getTranslations("legal.privacy");

  return (
    <section className="bg-white py-16">
      <div className="container max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold text-brand-900">{t("title")}</h1>
        <p className="text-neutral-600">{t("intro")}</p>
        <h2 className="text-xl font-semibold text-brand-900">{t("processingTitle")}</h2>
        <p className="text-neutral-600">{t("processingText")}</p>
        <h2 className="text-xl font-semibold text-brand-900">{t("retentionTitle")}</h2>
        <p className="text-neutral-600">{t("retentionText")}</p>
        <h2 className="text-xl font-semibold text-brand-900">{t("rightsTitle")}</h2>
        <p className="text-neutral-600">{t("rightsText")}</p>
      </div>
    </section>
  );
};

export default PrivacyPage;
