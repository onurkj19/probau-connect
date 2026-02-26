import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

interface PublicProject {
  id: string;
  owner_id: string;
  title: string;
  address: string;
  category: string;
  deadline: string;
  created_at: string;
  attachments: string[] | null;
  owner_company_name: string | null;
  owner_profile_title: string | null;
  owner_avatar_url: string | null;
}

const Projects = () => {
  const { t } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    await supabase.rpc("cleanup_expired_projects");
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("projects")
      .select("id, owner_id, title, address, category, deadline, created_at, attachments, owner_company_name, owner_profile_title, owner_avatar_url")
      .eq("status", "active")
      .gt("deadline", nowIso)
      .order("created_at", { ascending: false });
    setProjects((data ?? []) as PublicProject[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const channel = supabase
      .channel("projects-public-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          void loadProjects();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadProjects]);

  return (
    <main className="bg-background py-20">
      <div className="container">
        <h1 className="font-display text-4xl font-bold text-foreground">{t("nav.projects")}</h1>
        <p className="mt-2 text-muted-foreground">{t("projects.subtitle")}</p>

        <div className="mt-10 grid gap-4">
          {loading && <p className="text-sm text-muted-foreground">{t("projects.loading")}</p>}
          {!loading && projects.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("projects.no_projects")}</p>
          )}
          {!loading &&
            projects.map((p) => (
              <ProjectCard
                key={p.id}
                company={p.owner_company_name || "ProBau.ch"}
                description={p.title}
                location={p.address}
                deadline={p.deadline}
                publishedAt={p.created_at}
                attachments={p.attachments}
                projectId={p.id}
                ownerId={p.owner_id}
                projectType={p.category}
                owner={{
                  company_name: p.owner_company_name,
                  profile_title: p.owner_profile_title,
                  avatar_url: p.owner_avatar_url,
                }}
                actions={
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/${lang}/login`}>{t("nav.login")}</Link>
                  </Button>
                }
              />
            ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("projects.login_prompt")}
        </p>
      </div>
    </main>
  );
};

export default Projects;
