import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useAuth } from "@/lib/auth";
import { DashboardCardSkeleton } from "@/components/common/DashboardCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { FolderOpen } from "lucide-react";

interface PublicProject {
  id: string;
  owner_id: string;
  title: string;
  address: string;
  category: string;
  custom_category: string | null;
  deadline: string;
  created_at: string;
  attachments: string[] | null;
  owner_company_name: string | null;
  owner_profile_title: string | null;
  owner_avatar_url: string | null;
}

const Projects = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    await supabase.rpc("cleanup_expired_projects");
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("projects")
      .select("id, owner_id, title, address, category, custom_category, deadline, created_at, attachments, owner_company_name, owner_profile_title, owner_avatar_url")
      .eq("status", "active")
      .gt("deadline", nowIso)
      .order("created_at", { ascending: false });
    setProjects((data ?? []) as PublicProject[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    void loadProjects();
  }, [loadProjects, user]);

  useEffect(() => {
    if (!user) return;
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
  }, [loadProjects, user]);

  return (
    <main className="bg-background section-y">
      <div className="container px-4">
        <h1 className="page-title">{t("nav.projects")}</h1>
        <p className="page-subtitle md:text-base">{t("projects.subtitle")}</p>

        {!isLoading && !user ? (
          <div className="app-card app-card--interactive mt-10 text-center">
            <p className="text-sm text-muted-foreground">{t("projects.login_prompt")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link to={`/${lang}/login`}>{t("nav.login")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/${lang}/register`}>{t("nav.register")}</Link>
              </Button>
            </div>
          </div>
        ) : (
        <div className="mt-10 grid gap-6 md:gap-8">
          {loading && <DashboardCardSkeleton count={2} />}
          {!loading && projects.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title={t("projects.no_projects")}
              description={t("projects.subtitle")}
            />
          )}
          {!loading &&
            projects.map((p) => (
              <ProjectCard
                key={p.id}
                company={p.owner_company_name || "ProjektMarkt"}
                description={p.title}
                location={p.address}
                deadline={p.deadline}
                publishedAt={p.created_at}
                attachments={p.attachments}
                projectId={p.id}
                ownerId={p.owner_id}
                projectType={p.custom_category || p.category}
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
        )}

        {!user && !isLoading && (
          <p className="mt-8 text-center text-sm text-muted-foreground">{t("projects.login_prompt")}</p>
        )}
      </div>
    </main>
  );
};

export default Projects;
