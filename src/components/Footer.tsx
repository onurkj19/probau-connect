import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
                <span className="font-display text-sm font-bold text-accent-foreground">P</span>
              </div>
              <span className="font-display text-lg font-bold">
                Pro<span className="text-accent">Bau</span>.ch
              </span>
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/70">
              {t("footer.description")}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-primary-foreground/50">
              <span className="inline-block h-3 w-4 rounded-sm bg-accent" />
              {t("footer.swiss_made")} 🇨🇭
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/projects" className="hover:text-primary-foreground">{t("nav.projects")}</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-foreground">{t("nav.pricing")}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/impressum" className="hover:text-primary-foreground">{t("nav.impressum")}</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-foreground">{t("nav.privacy")}</Link></li>
              <li><Link to="/terms" className="hover:text-primary-foreground">{t("nav.terms")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Zürich, Schweiz</li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@probau.ch</li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +41 44 000 00 00</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} ProBau.ch AG. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
