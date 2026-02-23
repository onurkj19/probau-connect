import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export { default } from "@/app/(public)/pricing/page";

interface PricingMetadataProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: PricingMetadataProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.pricing" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        de: "/de/pricing",
        fr: "/fr/pricing",
        it: "/it/pricing",
        en: "/en/pricing",
      },
    },
  };
};
