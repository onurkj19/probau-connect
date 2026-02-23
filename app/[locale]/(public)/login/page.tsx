import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export { default } from "@/app/(public)/login/page";

interface LoginMetadataProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: LoginMetadataProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.login" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        de: "/de/login",
        fr: "/fr/login",
        it: "/it/login",
        en: "/en/login",
      },
    },
  };
};
