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

  const isOwner = user?.role === "owner";
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
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.overview")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {user?.companyName}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
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
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
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
