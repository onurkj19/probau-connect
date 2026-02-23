import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation();
  return (
    <main className="bg-background py-20">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("terms.title")}</h1>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("terms.intro")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">1. Geltungsbereich</h2>
          <p>Diese AGB gelten für alle Nutzer der Plattform ProBau.ch, einschliesslich Arbeitgeber und Unternehmer.</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">2. Registrierung</h2>
          <p>Die Nutzung der Plattform erfordert eine Registrierung mit wahrheitsgemässen Angaben.</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">3. Leistungen</h2>
          <p>Arbeitgeber können kostenlos Projekte ausschreiben. Unternehmer benötigen ein kostenpflichtiges Abonnement.</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">4. Haftung</h2>
          <p>ProBau.ch haftet nicht für die Inhalte der von Nutzern eingestellten Projekte und Offerten.</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">5. Anwendbares Recht</h2>
          <p>Es gilt Schweizer Recht. Gerichtsstand ist Zürich.</p>
        </div>
      </div>
    </main>
  );
};

export default Terms;
