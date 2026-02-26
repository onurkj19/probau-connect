import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

interface DbProject {
  id: string;
  title: string;
  address: string;
  category: string;
  service: string;
  attachments: string[] | null;
  deadline: string;
  status: string;
  owner_id: string;
  owner_company_name: string | null;
  owner_profile_title: string | null;
  owner_avatar_url: string | null;
  created_at: string;
}

const DashboardSavedProjects = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const categoryLabelMap = useMemo(
    () => ({
      fassade: t("dashboard.category_fassade"),
      gerust: t("dashboard.category_gerust"),
      elektriker: t("dashboard.category_elektriker"),
      reinigung: t("dashboard.category_reinigung"),
      heizung: t("dashboard.category_heizung"),
      sanitar: t("dashboard.category_sanitar"),
    }),
    [t],
  );

  useEffect(() => {
    if (!user) return;
    let canceled = false;
    const load = async () => {
      setLoading(true);
      const { data: bookmarkRows } = await supabase
        .from("bookmarks")
        .select("project_id")
        .eq("user_id", user.id);

      const ids = (bookmarkRows ?? []).map((row) => row.project_id);
      if (!ids.length) {
        if (!canceled) {
          setBookmarkedIds([]);
          setProjects([]);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("projects")
        .select("id, title, address, category, service, attachments, deadline, status, owner_id, owner_company_name, owner_profile_title, owner_avatar_url, created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });

      if (!canceled) {
        setBookmarkedIds(ids);
        setProjects((data ?? []) as DbProject[]);
        setLoading(false);
      }
    };

    void load();
    return () => {
      canceled = true;
    };
  }, [user]);

  const removeBookmark = async (projectId: string) => {
    if (!user) return;
    await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("project_id", projectId);
    setBookmarkedIds((prev) => prev.filter((id) => id !== projectId));
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.saved_projects")}</h1>
      <div className="mt-6 grid gap-4">
        {loading && <p className="text-sm text-muted-foreground">{t("dashboard.loading_saved_projects")}</p>}
        {!loading && projects.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("dashboard.no_saved_projects")}</p>
        )}
        {!loading &&
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              company={project.owner_company_name || t("nav.projects")}
              description={project.title}
              location={project.address}
              deadline={project.deadline}
              publishedAt={project.created_at}
              attachments={project.attachments}
              projectId={project.id}
              ownerId={project.owner_id}
              projectType={categoryLabelMap[project.category as keyof typeof categoryLabelMap] || project.category}
              owner={{
                company_name: project.owner_company_name,
                profile_title: project.owner_profile_title,
                avatar_url: project.owner_avatar_url,
              }}
              bookmarked={bookmarkedIds.includes(project.id)}
              onToggleBookmark={() => {
                void removeBookmark(project.id);
              }}
            />
          ))}
      </div>
    </div>
  );
};

export default DashboardSavedProjects;
