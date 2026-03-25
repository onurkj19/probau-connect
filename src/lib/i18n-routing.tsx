import { useEffect } from "react";
import { useParams, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";
import { RouteFade } from "@/components/RouteFade";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

export const SUPPORTED_LOCALES = ["de", "fr", "it", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export function LocaleRedirect() {
  const { i18n } = useTranslation();
  const lang = isValidLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
  return <Navigate to={`/${lang}`} replace />;
}

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!locale || !isValidLocale(locale)) return;
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  /** Invalid /:locale (e.g. /xx) — redirect instead of rendering null (blank screen). */
  if (!locale || !isValidLocale(locale)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />;
  }

  return (
    <RouteFade>
      <Outlet />
    </RouteFade>
  );
}

export function useLocaleNavigate() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const currentLocale = locale && isValidLocale(locale) ? locale : i18n.language;

  return (path: string, options?: { replace?: boolean }) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    navigate(`/${currentLocale}${cleanPath}`, options);
  };
}

export function useLocalePath() {
  const { locale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();
  const currentLocale = locale && isValidLocale(locale) ? locale : i18n.language;

  return (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/${currentLocale}${cleanPath}`;
  };
}

export function useChangeLocale() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();

  return (newLocale: Locale) => {
    const currentLocale = locale && isValidLocale(locale) ? locale : i18n.language;
    const pathWithoutLocale = location.pathname.replace(`/${currentLocale}`, "") || "/";
    i18n.changeLanguage(newLocale);
    // Keep auth metadata in sync so Supabase email templates can use preferred_locale.
    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!data.session?.user) return;
        await supabase.auth.updateUser({
          data: { preferred_locale: newLocale },
        });
      })
      .catch(() => {
        // Ignore locale sync errors to avoid blocking navigation.
      });
    navigate(`/${newLocale}${pathWithoutLocale}${location.search}${location.hash}`, { replace: true });
  };
}
