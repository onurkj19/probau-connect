import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const links = [
  { href: "/", labelKey: "platform" },
  { href: "/pricing", labelKey: "pricing" },
  { href: "/impressum", labelKey: "impressum" },
  { href: "/privacy", labelKey: "privacy" },
  { href: "/agb", labelKey: "agb" },
] as const;

export const PublicHeader = () => {
  const tNav = useTranslations("navigation.public");
  const tCommon = useTranslations("common.actions");

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold text-brand-900">
          ProBau<span className="text-swiss-red">.ch</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-brand-900"
            >
              {tNav(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="secondary" size="sm">
              {tCommon("login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">{tCommon("getStarted")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
