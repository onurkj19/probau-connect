import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export { default } from "@/app/(public)/privacy/page";

interface PrivacyMetadataProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: PrivacyMetadataProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.privacy" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        de: "/de/privacy",
        fr: "/fr/privacy",
        it: "/it/privacy",
        en: "/en/privacy",
      },
    },
  };
};
