import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const links = [
  { href: "/impressum", labelKey: "impressum" },
  { href: "/privacy", labelKey: "privacy" },
  { href: "/agb", labelKey: "agb" },
] as const;

export const PublicFooter = () => {
  const tNav = useTranslations("navigation.public");
  const tFooter = useTranslations("common.footer");

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="container flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-neutral-600">
          © {new Date().getFullYear()} ProBau.ch AG. {tFooter("rights")}
        </p>
        <div className="flex items-center gap-5">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-600 transition-colors hover:text-brand-900"
            >
              {tNav(item.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};
