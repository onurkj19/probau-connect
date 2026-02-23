import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const languages = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/projects", label: t("nav.projects") },
    { to: "/pricing", label: t("nav.pricing") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <span className="font-display text-sm font-bold text-accent-foreground">P</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Pro<span className="text-accent">Bau</span>.ch
          </span>
        </Link>

        {/* Desktop nav */}
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

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-xs">{currentLang.code.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={i18n.language === lang.code ? "bg-secondary" : ""}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm">
            {t("nav.login")}
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            {t("nav.register")}
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
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
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setMobileOpen(false); }}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    i18n.language === lang.code ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1">
                {t("nav.login")}
              </Button>
              <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                {t("nav.register")}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
