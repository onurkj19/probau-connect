import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { FolderOpen, FileText, Clock, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const DashboardOverview = () => {
  const { t } = useTranslation();
  const { user, offerLimit } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const isOwner = user?.role === "project_owner";
  const isContractor = user?.role === "contractor";
  const isActive = user?.subscriptionStatus === "active";
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  const loadActiveProjectsCount = useCallback(async () => {
    if (!user) return;
    await supabase.rpc("cleanup_expired_projects");
    const nowIso = new Date().toISOString();
    const baseQuery = supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gt("deadline", nowIso);

    const { count } = isOwner
      ? await baseQuery.eq("owner_id", user.id)
      : await baseQuery;

    setActiveProjectsCount(count ?? 0);
  }, [isOwner, user]);

  useEffect(() => {
    void loadActiveProjectsCount();
  }, [loadActiveProjectsCount]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`overview-projects-live-${isOwner ? user.id : "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          if (!isOwner) {
            void loadActiveProjectsCount();
            return;
          }

          const newOwnerId = (payload.new as { owner_id?: string } | null)?.owner_id;
          const oldOwnerId = (payload.old as { owner_id?: string } | null)?.owner_id;
          if (newOwnerId === user.id || oldOwnerId === user.id) {
            void loadActiveProjectsCount();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOwner, loadActiveProjectsCount, user]);

  return (
    <div className="stack-page">
      <div>
        <h1 className="page-title">{t("dashboard.overview")}</h1>
        <p className="page-subtitle">{user?.companyName}</p>
      </div>

      <div className="dashboard-grid">
        <StatsCard
          title={t("dashboard.active_projects")}
          value={activeProjectsCount}
          icon={FolderOpen}
        />
        <StatsCard
          title={isOwner ? t("dashboard.total_offers") : t("dashboard.my_offers")}
          value={isContractor ? user?.offerCountThisMonth || 0 : 0}
          icon={FileText}
          description={
            isContractor && isActive && offerLimit
              ? `${t("subscription.basic_limit")}`
              : undefined
          }
        />
        <StatsCard
          title={t("dashboard.pending_offers")}
          value={0}
          icon={Clock}
        />
      </div>

      {isContractor && !isActive && (
        <div className="rounded-2xl border border-yellow-200/80 bg-yellow-50/95 p-6 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-yellow-50/85">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">{t("dashboard.subscription_required_message")}</p>
            </div>
            <Button size="sm" asChild>
              <Link to={`/${lang}/dashboard/subscription`}>{t("dashboard.upgrade_now")}</Link>
            </Button>
          </div>
        </div>
      )}

      {isContractor && isActive && user?.planType && (
        <div className="rounded-2xl border border-green-200/80 bg-green-50/95 p-6 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-green-50/85">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              {t(`pricing.${user.planType}.name`)} — {t("subscription.active_status")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
