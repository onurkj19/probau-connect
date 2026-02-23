import { useTranslation } from "react-i18next";
import { FolderOpen, FileText, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { StatsCard } from "@/components/dashboard/StatsCard";

const DashboardOverview = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isOwner = user?.role === "owner";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.overview")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {user?.companyName}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={t("dashboard.active_projects")}
          value={0}
          icon={FolderOpen}
        />
        <StatsCard
          title={isOwner ? t("dashboard.total_offers") : t("dashboard.my_offers")}
          value={0}
          icon={FileText}
        />
        <StatsCard
          title={t("dashboard.pending_offers")}
          value={0}
          icon={Clock}
        />
      </div>
    </div>
  );
};

export default DashboardOverview;
