import { useTranslation } from "react-i18next";
import { Building2, Clock, MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface ProjectCardProps {
  company: string;
  description: string;
  location: string;
  deadline: string;
  actions?: React.ReactNode;
}

export function ProjectCard({ company, description, location, deadline, actions }: ProjectCardProps) {
  const { t } = useTranslation();
  const daysLeft = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
  const isActive = daysLeft > 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          {company}
        </div>
        <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{description}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />{location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />{t("projects.days_left", { count: daysLeft })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge
          status={isActive ? "active" : "closed"}
          label={isActive ? t("projects.status_active") : t("projects.status_closed")}
        />
        {actions}
      </div>
    </div>
  );
}
