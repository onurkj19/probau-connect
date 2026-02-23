import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation();
  return (
    <main className="bg-background py-20">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("terms.title")}</h1>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("terms.intro")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("terms.scope_title")}</h2>
          <p>{t("terms.scope_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("terms.registration_title")}</h2>
          <p>{t("terms.registration_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("terms.services_title")}</h2>
          <p>{t("terms.services_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("terms.liability_title")}</h2>
          <p>{t("terms.liability_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("terms.law_title")}</h2>
          <p>{t("terms.law_text")}</p>
        </div>
      </div>
    </main>
  );
};

export default Terms;
