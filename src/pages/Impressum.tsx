import { useTranslation } from "react-i18next";

const Impressum = () => {
  const { t } = useTranslation();
  return (
    <main className="bg-background py-20">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("impressum.title")}</h1>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("impressum.company")}</p>
          <p>{t("impressum.address")}</p>
          <p>{t("impressum.email")}</p>
          <p>{t("impressum.phone")}</p>
          <p>{t("impressum.uid")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("impressum.responsible")}</h2>
          <p>Max Muster, CEO</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("impressum.disclaimer")}</h2>
          <p>Die Inhalte dieser Webseite werden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
        </div>
      </div>
    </main>
  );
};

export default Impressum;
