import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export { default } from "@/app/(public)/register/page";

interface RegisterMetadataProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: RegisterMetadataProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.register" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        de: "/de/register",
        fr: "/fr/register",
        it: "/it/register",
        en: "/en/register",
      },
    },
  };
};
