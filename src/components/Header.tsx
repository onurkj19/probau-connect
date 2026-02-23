import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChangeLocale, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n-routing";
import { useAuth } from "@/lib/auth";

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const changeLocale = useChangeLocale();
  const { user, logout } = useAuth();

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const navLinks = [
    { to: `/${lang}`, label: t("nav.home") },
    { to: `/${lang}/projects`, label: t("nav.projects") },
    { to: `/${lang}/pricing`, label: t("nav.pricing") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to={`/${lang}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <span className="font-display text-sm font-bold text-accent-foreground">P</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Pro<span className="text-accent">Bau</span>.ch
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-xs">{currentLang.code.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => changeLocale(l.code)}
                  className={i18n.language === l.code ? "bg-secondary" : ""}
                >
                  <span className="mr-2">{l.flag}</span>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/${lang}/dashboard`}>{t("nav.dashboard")}</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={logout}>
                {t("nav.login")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/${lang}/login`}>{t("nav.login")}</Link>
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link to={`/${lang}/register`}>{t("nav.register")}</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { changeLocale(l.code); setMobileOpen(false); }}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    i18n.language === l.code ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <Link to={`/${lang}/dashboard`} onClick={() => setMobileOpen(false)}>
                      {t("nav.dashboard")}
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { logout(); setMobileOpen(false); }}>
                    {t("nav.login")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1" asChild>
                    <Link to={`/${lang}/login`} onClick={() => setMobileOpen(false)}>
                      {t("nav.login")}
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link to={`/${lang}/register`} onClick={() => setMobileOpen(false)}>
                      {t("nav.register")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
