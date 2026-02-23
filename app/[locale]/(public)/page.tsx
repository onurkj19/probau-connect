import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export { default } from "@/app/(public)/page";

interface HomePageMetadataProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: HomePageMetadataProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        de: "/de",
        fr: "/fr",
        it: "/it",
        en: "/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale,
    },
  };
};
