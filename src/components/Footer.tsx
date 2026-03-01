import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Mail, Phone } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { BrandLogo } from "@/components/BrandLogo";

const Footer = () => {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <BrandLogo to={`/${lang}`} imageClassName="h-9" textClassName="text-primary-foreground" />
            <p className="mt-3 text-sm text-primary-foreground/70">
              {t("footer.description")}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-primary-foreground/50">
              <span className="inline-block h-3 w-4 rounded-sm bg-accent" />
              {t("footer.swiss_made")}
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to={`/${lang}/projects`} className="hover:text-primary-foreground">{t("nav.projects")}</Link></li>
              <li><Link to={`/${lang}/pricing`} className="hover:text-primary-foreground">{t("nav.pricing")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to={`/${lang}/impressum`} className="hover:text-primary-foreground">{t("nav.impressum")}</Link></li>
              <li><Link to={`/${lang}/privacy`} className="hover:text-primary-foreground">{t("nav.privacy")}</Link></li>
              <li><Link to={`/${lang}/terms`} className="hover:text-primary-foreground">{t("nav.terms")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {t("footer.location")}</li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@projektmarkt.ch</li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +41 44 000 00 00</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} ProjektMarkt AG. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
