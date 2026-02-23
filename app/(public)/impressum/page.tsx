import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {};

const ImpressumPage = async () => {
  const t = await getTranslations("legal.impressum");

  return (
    <section className="bg-white py-16">
      <div className="container max-w-3xl space-y-5">
        <h1 className="text-4xl font-bold text-brand-900">{t("title")}</h1>
        <p className="text-neutral-600">{t("company")}</p>
        <p className="text-neutral-600">{t("address")}</p>
        <p className="text-neutral-600">{t("email")}</p>
        <p className="text-neutral-600">{t("phone")}</p>
        <p className="text-neutral-600">{t("uid")}</p>
        <p className="text-neutral-600">{t("responsible")}</p>
      </div>
    </section>
  );
};

export default ImpressumPage;
