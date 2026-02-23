"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Select } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const locales = routing.locales;

export const LanguageSwitcher = () => {
  const t = useTranslations("common.languageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
      <Globe className="h-4 w-4 text-neutral-500" />
      <span className="sr-only">{t("label")}</span>
      <Select
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as (typeof locales)[number];
          router.replace(pathname, { locale: nextLocale });
        }}
        className="h-9 min-w-[132px] bg-white"
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {t(item)}
          </option>
        ))}
      </Select>
    </label>
  );
};
