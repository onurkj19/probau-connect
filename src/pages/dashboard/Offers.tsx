import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";

const DashboardOffers = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.my_offers")}</h1>

      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">
          {t("dashboard.pending_offers")}: 0
        </p>
      </div>
    </div>
  );
};

export default DashboardOffers;
