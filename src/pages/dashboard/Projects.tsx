import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const sampleProjects = [
  { company: "Müller Bau AG", location: "Zürich", deadline: "2026-04-15", description: "Sanierung Mehrfamilienhaus" },
  { company: "Genossenschaft Wohnen", location: "Bern", deadline: "2026-03-30", description: "Neubau Wohnüberbauung" },
];

const DashboardProjects = () => {
  const { t } = useTranslation();
  const { user, canSubmitOffer, offerLimitReached } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const isOwner = user?.role === "owner";
  const isContractor = user?.role === "contractor";
  const hasNoSubscription = isContractor && user?.subscriptionStatus !== "active";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {isOwner ? t("dashboard.my_projects") : t("dashboard.find_projects")}
        </h1>
        {isOwner && (
          <Button>{t("dashboard.new_project")}</Button>
        )}
      </div>

      {/* Subscription required banner */}
      {hasNoSubscription && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <Lock className="h-5 w-5 shrink-0 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">{t("dashboard.subscription_required_message")}</p>
          </div>
          <Button size="sm" asChild>
            <Link to={`/${lang}/dashboard/subscription`}>{t("dashboard.upgrade_now")}</Link>
          </Button>
        </div>
      )}

      {/* Offer limit reached banner */}
      {offerLimitReached && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">{t("subscription.limit_reached")}</p>
            <p className="text-xs text-orange-600">
              {t("subscription.used_of_limit", { used: user?.offerCountThisMonth || 0, limit: 10 })}
            </p>
          </div>
          <Button size="sm" asChild>
            <Link to={`/${lang}/dashboard/subscription`}>{t("subscription.upgrade_to_pro")}</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-4">
        {sampleProjects.map((p, i) => (
          <ProjectCard
            key={i}
            {...p}
            actions={
              isContractor ? (
                <Button
                  size="sm"
                  disabled={!canSubmitOffer}
                  title={
                    !canSubmitOffer
                      ? offerLimitReached
                        ? t("subscription.limit_reached")
                        : t("dashboard.subscription_required")
                      : undefined
                  }
                >
                  {t("dashboard.submit_offer")}
                </Button>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardProjects;
