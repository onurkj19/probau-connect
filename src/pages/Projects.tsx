import { useTranslation } from "react-i18next";
import { Building2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const sampleProjects = [
  { company: "Müller Bau AG", location: "Zürich", deadline: "2026-04-15", description: "Sanierung Mehrfamilienhaus" },
  { company: "Genossenschaft Wohnen", location: "Bern", deadline: "2026-03-30", description: "Neubau Wohnüberbauung" },
  { company: "Stadt Luzern", location: "Luzern", deadline: "2026-05-01", description: "Strassenbau und Kanalisation" },
];

const Projects = () => {
  const { t } = useTranslation();

  return (
    <main className="bg-background py-20">
      <div className="container">
        <h1 className="font-display text-4xl font-bold text-foreground">{t("nav.projects")}</h1>
        <p className="mt-2 text-muted-foreground">{t("projects.subtitle")}</p>

        <div className="mt-10 grid gap-4">
          {sampleProjects.map((p, i) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000));
            const isActive = daysLeft > 0;
            return (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {p.company}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{p.description}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t("projects.days_left", { count: daysLeft })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {isActive ? t("projects.status_active") : t("projects.status_closed")}
                  </span>
                  <Button size="sm" variant="outline">{t("nav.login")}</Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("projects.login_prompt")}
        </p>
      </div>
    </main>
  );
};

export default Projects;
