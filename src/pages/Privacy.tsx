import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation();
  return (
    <main className="bg-background py-20">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("privacy.title")}</h1>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("privacy.intro")}</p>
          <p>{t("privacy.dsg")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">1. Verantwortliche Stelle</h2>
          <p>ProBau.ch AG, Musterstrasse 1, 8001 Zürich</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">2. Erhobene Daten</h2>
          <p>Wir erheben personenbezogene Daten nur im Rahmen der Nutzung unserer Plattform: Name, E-Mail, Telefon, Firmenangaben.</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">3. Cookies</h2>
          <p>Unsere Webseite verwendet technisch notwendige Cookies. Sie können Cookies in Ihrem Browser deaktivieren.</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">4. Ihre Rechte</h2>
          <p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten. Kontaktieren Sie uns unter info@probau.ch.</p>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
