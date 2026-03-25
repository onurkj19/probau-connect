import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, ChevronDown, Search, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChangeLocale, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n-routing";
import { useAuth } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const changeLocale = useChangeLocale();
  const { user, logout } = useAuth();

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];
  const dashboardBase = `/${lang}/dashboard`;

  const profileInitials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLinks = [
    { to: `/${lang}`, label: t("nav.home") },
    { to: `/${lang}/projects`, label: t("nav.projects") },
    { to: `/${lang}/pricing`, label: t("nav.pricing") },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/${lang}/projects`);
  };

  return (
    <header className="surface-glass-chrome sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between gap-4">
        <BrandLogo to={`/${lang}`} className="shrink-0" imageClassName="h-14" />

        <form onSubmit={handleSearch} className="mx-4 hidden min-w-0 max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              className="h-9 pl-9"
              placeholder={t("nav.search_placeholder", { defaultValue: "Search projects…" })}
              aria-label={t("nav.search_placeholder", { defaultValue: "Search projects…" })}
            />
          </div>
        </form>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground transition-all duration-200 ease-smooth hover:text-foreground hover:opacity-90"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
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
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 rounded-full px-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                      <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                        {profileInitials || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to={dashboardBase}>{t("nav.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`${dashboardBase}/settings`} className="flex cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("dashboard.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void logout();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/${lang}/login`}>{t("nav.login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/${lang}/register`}>{t("nav.register")}</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" className="pl-9" placeholder={t("nav.search_placeholder", { defaultValue: "Search…" })} />
            </div>
          </form>
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-muted-foreground transition-all duration-200 ease-smooth hover:text-foreground hover:opacity-90"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    changeLocale(l.code);
                    setMobileOpen(false);
                  }}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    i18n.language === l.code ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <span className="text-xs text-muted-foreground">{t("nav.notifications", { defaultValue: "Notifications" })}</span>
                  </div>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={dashboardBase} onClick={() => setMobileOpen(false)}>
                      {t("nav.dashboard")}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${dashboardBase}/settings`} onClick={() => setMobileOpen(false)}>
                      {t("dashboard.settings")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void logout();
                      setMobileOpen(false);
                    }}
                  >
                    {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`/${lang}/login`} onClick={() => setMobileOpen(false)}>
                      {t("nav.login")}
                    </Link>
                  </Button>
                  <Button asChild>
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
