import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Lock, UploadCloud } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

interface DbProject {
  id: string;
  title: string;
  address: string;
  category: string;
  service: string;
  deadline: string;
  status: string;
  owner_id: string;
  owner_company_name: string | null;
  owner_profile_title: string | null;
  owner_avatar_url: string | null;
  created_at: string;
}

const toDateTimeLocalValue = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const getDefaultDeadlineValue = () => {
  const next = new Date();
  next.setDate(next.getDate() + 14);
  next.setHours(17, 0, 0, 0);
  return toDateTimeLocalValue(next);
};

const DashboardProjects = () => {
  const { t } = useTranslation();
  const { user, canSubmitOffer, offerLimitReached } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const isOwner = user?.role === "owner";
  const isContractor = user?.role === "contractor";
  const hasNoSubscription = isContractor && user?.subscriptionStatus !== "active";
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("fassade");
  const [service, setService] = useState("");
  const [deadlineAt, setDeadlineAt] = useState(getDefaultDeadlineValue());
  const [files, setFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const categoryOptions = [
    { value: "fassade", label: t("dashboard.category_fassade") },
    { value: "gerust", label: t("dashboard.category_gerust") },
    { value: "elektriker", label: t("dashboard.category_elektriker") },
    { value: "reinigung", label: t("dashboard.category_reinigung") },
    { value: "heizung", label: t("dashboard.category_heizung") },
    { value: "sanitar", label: t("dashboard.category_sanitar") },
  ];
  const categoryLabelMap = useMemo(
    () => Object.fromEntries(categoryOptions.map((option) => [option.value, option.label])),
    [categoryOptions],
  );

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);
    const baseQuery = supabase
      .from("projects")
      .select("id, title, address, category, service, deadline, status, owner_id, owner_company_name, owner_profile_title, owner_avatar_url, created_at")
      .order("created_at", { ascending: false });

    const { data, error } = isOwner
      ? await baseQuery.eq("owner_id", user.id)
      : await baseQuery.eq("status", "active");

    if (error) {
      setActionError(error.message);
      setProjects([]);
    } else {
      setProjects((data ?? []) as DbProject[]);
    }
    setLoadingProjects(false);
  }, [isOwner, user]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`projects-live-${isOwner ? user.id : "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          if (!isOwner) {
            void loadProjects();
            return;
          }

          const newOwnerId = (payload.new as { owner_id?: string } | null)?.owner_id;
          const oldOwnerId = (payload.old as { owner_id?: string } | null)?.owner_id;
          if (newOwnerId === user.id || oldOwnerId === user.id) {
            void loadProjects();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOwner, loadProjects, user]);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !address || !service || !deadlineAt) return;

    setSubmitting(true);
    setActionError(null);
    setSubmitted(false);
    try {
      const attachmentUrls: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, "-");
        const storagePath = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(storagePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("project-files").getPublicUrl(storagePath);
        attachmentUrls.push(data.publicUrl);
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          address: address.trim(),
          category,
          project_type: category,
          service: service.trim(),
          deadline: new Date(deadlineAt).toISOString(),
          status: "active",
          attachments: attachmentUrls,
          owner_company_name: user.companyName,
          owner_profile_title: user.profileTitle || null,
          owner_avatar_url: user.avatarUrl || null,
        })
        .select("id, title, address, category, service, deadline, status, owner_id, owner_company_name, owner_profile_title, owner_avatar_url, created_at")
        .single();

      if (error) throw error;

      setProjects((prev) => [data as DbProject, ...prev]);
      setTitle("");
      setAddress("");
      setCategory("fassade");
      setService("");
      setDeadlineAt(getDefaultDeadlineValue());
      setFiles([]);
      setSubmitted(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.project_publish_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {isOwner ? t("dashboard.my_projects") : t("dashboard.find_projects")}
        </h1>
        {isOwner && (
          <Button type="button" onClick={() => document.getElementById("owner-project-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            {t("dashboard.new_project")}
          </Button>
        )}
      </div>

      {isOwner && (
        <div id="owner-project-form" className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elevated">
          <div className="mb-5">
            <h2 className="font-display text-xl font-semibold text-foreground">{t("dashboard.create_project_title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.create_project_subtitle")}</p>
          </div>

          <form onSubmit={handleOwnerSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project-title">{t("dashboard.project_title")}</Label>
              <Input
                id="project-title"
                placeholder={t("dashboard.project_title_placeholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-address">{t("dashboard.project_address")}</Label>
              <Input
                id="project-address"
                placeholder={t("dashboard.project_address_placeholder")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-category">{t("dashboard.project_category")}</Label>
              <select
                id="project-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-service">{t("dashboard.project_service")}</Label>
              <Textarea
                id="project-service"
                placeholder={t("dashboard.project_service_placeholder")}
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-deadline">{t("dashboard.project_deadline")}</Label>
              <Input
                id="project-deadline"
                type="datetime-local"
                value={deadlineAt}
                onChange={(e) => setDeadlineAt(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-files">{t("dashboard.project_files")}</Label>
              <label htmlFor="project-files" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground hover:bg-muted">
                <UploadCloud className="h-4 w-4" />
                {t("dashboard.project_files_hint")}
              </label>
              <input
                id="project-files"
                type="file"
                className="hidden"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">{t("dashboard.files_selected", { count: files.length })}</p>
                  <ul className="space-y-1">
                    {files.map((file) => (
                      <li key={file.name} className="truncate">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "..." : t("dashboard.publish_project")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitle("");
                  setAddress("");
                  setCategory("fassade");
                  setService("");
                  setDeadlineAt(getDefaultDeadlineValue());
                  setFiles([]);
                  setSubmitted(false);
                  setActionError(null);
                }}
              >
                {t("dashboard.clear_form")}
              </Button>
            </div>
          </form>

          {submitted && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {t("dashboard.project_saved_note")}
            </div>
          )}
          {actionError && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </div>
          )}
        </div>
      )}

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
        {loadingProjects && (
          <p className="text-sm text-muted-foreground">{t("dashboard.loading_projects")}</p>
        )}
        {!loadingProjects && projects.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("dashboard.no_projects")}</p>
        )}
        {!loadingProjects &&
          projects.map((p) => (
            <ProjectCard
              key={p.id}
              company={p.owner_company_name || t("nav.projects")}
              description={p.title}
              location={p.address}
              deadline={p.deadline}
              projectId={p.id}
              projectType={categoryLabelMap[p.category] || p.category}
              owner={{
                company_name: p.owner_company_name,
                profile_title: p.owner_profile_title,
                avatar_url: p.owner_avatar_url,
              }}
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
