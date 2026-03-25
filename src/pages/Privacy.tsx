import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation();
  return (
    <main className="bg-background section-y">
      <div className="container max-w-2xl px-4">
        <h1 className="page-title">{t("privacy.title")}</h1>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{t("privacy.intro")}</p>
          <p>{t("privacy.dsg")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("privacy.controller_title")}</h2>
          <p>{t("privacy.controller_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("privacy.data_title")}</h2>
          <p>{t("privacy.data_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("privacy.cookies_title")}</h2>
          <p>{t("privacy.cookies_text")}</p>
          <h2 className="pt-4 font-display text-lg font-semibold text-foreground">{t("privacy.rights_title")}</h2>
          <p>{t("privacy.rights_text")}</p>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
