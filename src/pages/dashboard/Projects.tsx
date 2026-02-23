import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";

const sampleProjects = [
  { company: "Müller Bau AG", location: "Zürich", deadline: "2026-04-15", description: "Sanierung Mehrfamilienhaus" },
  { company: "Genossenschaft Wohnen", location: "Bern", deadline: "2026-03-30", description: "Neubau Wohnüberbauung" },
];

const DashboardProjects = () => {
  const { t } = useTranslation();
  const { user, canSubmitOffer } = useAuth();
  const isOwner = user?.role === "owner";

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

      <div className="mt-8 grid gap-4">
        {sampleProjects.map((p, i) => (
          <ProjectCard
            key={i}
            {...p}
            actions={
              !isOwner ? (
                <Button
                  size="sm"
                  disabled={!canSubmitOffer}
                  title={!canSubmitOffer ? t("dashboard.subscription_required") : undefined}
                >
                  {t("dashboard.submit_offer")}
                </Button>
              ) : undefined
            }
          />
        ))}
      </div>

      {!isOwner && !canSubmitOffer && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm font-medium text-yellow-800">{t("dashboard.subscription_required_message")}</p>
          <Button variant="outline" size="sm" className="mt-2">
            {t("dashboard.upgrade_now")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardProjects;
