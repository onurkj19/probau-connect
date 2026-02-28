import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Lock, Pencil, Trash2, UploadCloud } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

interface DbProject {
  id: string;
  title: string;
  address: string;
  category: string;
  custom_category: string | null;
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
  const { user, canSubmitOffer, offerLimitReached, refreshUser } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const [searchParams] = useSearchParams();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const isOwner = user?.role === "project_owner";
  const isContractor = user?.role === "contractor";
  const hasNoSubscription = isContractor && user?.subscriptionStatus !== "active";
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("fassade");
  const [customCategory, setCustomCategory] = useState("");
  const [service, setService] = useState("");
  const [deadlineAt, setDeadlineAt] = useState(getDefaultDeadlineValue());
  const [files, setFiles] = useState<File[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [existingAttachmentUrls, setExistingAttachmentUrls] = useState<string[]>([]);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<DbProject | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerFiles, setOfferFiles] = useState<File[]>([]);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState<string | null>(null);
  const [createdChatId, setCreatedChatId] = useState<string | null>(null);
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
  const [bookmarkedProjectIds, setBookmarkedProjectIds] = useState<string[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<DbProject | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  const categoryOptions = [
    { value: "fassade", label: t("dashboard.category_fassade") },
    { value: "gerust", label: t("dashboard.category_gerust") },
    { value: "elektriker", label: t("dashboard.category_elektriker") },
    { value: "reinigung", label: t("dashboard.category_reinigung") },
    { value: "heizung", label: t("dashboard.category_heizung") },
    { value: "sanitar", label: t("dashboard.category_sanitar") },
    { value: "other", label: "Other" },
  ];
  const isCustomCategory = category === "other";
  const categoryLabelMap = useMemo(
    () => Object.fromEntries(categoryOptions.map((option) => [option.value, option.label])),
    [categoryOptions],
  );

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setLoadingProjects(true);

    // Hard-delete expired tenders in DB and then refresh active listings.
    await supabase.rpc("cleanup_expired_projects");

    const nowIso = new Date().toISOString();
    const baseQuery = supabase
      .from("projects")
      .select("id, title, address, category, custom_category, service, attachments, deadline, status, owner_id, owner_company_name, owner_profile_title, owner_avatar_url, created_at")
      .gt("deadline", nowIso)
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

  useEffect(() => {
    const projectFromQuery = searchParams.get("project");
    if (!projectFromQuery) return;
    setHighlightedProjectId(projectFromQuery);

    const timeout = window.setTimeout(() => {
      const el = document.getElementById(`project-card-${projectFromQuery}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);

    const clearHighlight = window.setTimeout(() => {
      setHighlightedProjectId((current) => (current === projectFromQuery ? null : current));
    }, 8000);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(clearHighlight);
    };
  }, [projects, searchParams]);

  useEffect(() => {
    if (!user) return;
    let canceled = false;
    const loadBookmarks = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("project_id")
        .eq("user_id", user.id);
      if (!canceled) {
        setBookmarkedProjectIds((data ?? []).map((row) => row.project_id));
      }
    };
    void loadBookmarks();
    return () => {
      canceled = true;
    };
  }, [user]);

  const toggleBookmark = async (projectId: string) => {
    if (!user) return;
    const already = bookmarkedProjectIds.includes(projectId);
    if (already) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", projectId);
      setBookmarkedProjectIds((prev) => prev.filter((id) => id !== projectId));
      return;
    }
    await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, project_id: projectId });
    setBookmarkedProjectIds((prev) => [...prev, projectId]);
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !address || !service || !deadlineAt) return;
    if (isCustomCategory && !customCategory.trim()) {
      setActionError("Please enter a custom category.");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const attachmentUrls: string[] = [...existingAttachmentUrls];
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

      const payload = {
        owner_id: user.id,
        title: title.trim(),
        address: address.trim(),
        category,
        custom_category: isCustomCategory ? customCategory.trim() : null,
        project_type: isCustomCategory ? customCategory.trim() : category,
        service: service.trim(),
        deadline: new Date(deadlineAt).toISOString(),
        status: "active" as const,
        attachments: attachmentUrls,
        owner_company_name: user.companyName,
        owner_profile_title: user.profileTitle || null,
        owner_avatar_url: user.avatarUrl || null,
      };

      const query = editingProjectId
        ? supabase
            .from("projects")
            .update(payload)
            .eq("id", editingProjectId)
            .eq("owner_id", user.id)
            .select("id, title, address, category, custom_category, service, attachments, deadline, status, owner_id, owner_company_name, owner_profile_title, owner_avatar_url, created_at")
            .single()
        : supabase
            .from("projects")
            .insert(payload)
            .select("id, title, address, category, custom_category, service, attachments, deadline, status, owner_id, owner_company_name, owner_profile_title, owner_avatar_url, created_at")
            .single();

      const { data, error } = await query;

      if (error) throw error;

      if (editingProjectId) {
        setProjects((prev) => prev.map((project) => (project.id === editingProjectId ? (data as DbProject) : project)));
      } else {
        setProjects((prev) => [data as DbProject, ...prev]);
      }
      setTitle("");
      setAddress("");
      setCategory("fassade");
      setCustomCategory("");
      setService("");
      setDeadlineAt(getDefaultDeadlineValue());
      setFiles([]);
      setExistingAttachmentUrls([]);
      setEditingProjectId(null);
      setSuccessMessage(editingProjectId ? t("dashboard.project_updated_note") : t("dashboard.project_saved_note"));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.project_publish_error"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetOwnerForm = () => {
    setTitle("");
    setAddress("");
    setCategory("fassade");
    setCustomCategory("");
    setService("");
    setDeadlineAt(getDefaultDeadlineValue());
    setFiles([]);
    setExistingAttachmentUrls([]);
    setEditingProjectId(null);
    setSuccessMessage(null);
    setActionError(null);
  };

  const handleEditProject = (project: DbProject) => {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setAddress(project.address);
    if (categoryOptions.some((option) => option.value === project.category)) {
      setCategory(project.category);
      setCustomCategory(project.custom_category || "");
    } else {
      setCategory("other");
      setCustomCategory(project.custom_category || project.category || "");
    }
    setService(project.service);
    setDeadlineAt(toDateTimeLocalValue(new Date(project.deadline)));
    setExistingAttachmentUrls(project.attachments ?? []);
    setFiles([]);
    setActionError(null);
    setSuccessMessage(null);
    document.getElementById("owner-project-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteProject = async (project: DbProject) => {
    if (!user) return;
    setDeletingProject(true);

    const { data: deletedRow, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)
      .eq("owner_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      setActionError(error.message);
      setDeletingProject(false);
      return;
    }
    if (!deletedRow) {
      setActionError(t("dashboard.project_delete_error"));
      setDeletingProject(false);
      return;
    }

    setProjects((prev) => prev.filter((item) => item.id !== project.id));
    if (editingProjectId === project.id) {
      resetOwnerForm();
    }
    setProjectToDelete(null);
    setDeletingProject(false);
    void loadProjects();
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;
    const parsedPrice = Number(offerPrice);
    if (!offerMessage.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setActionError(t("dashboard.offer_form_invalid"));
      return;
    }

    setOfferSubmitting(true);
    setActionError(null);
    setOfferSuccess(null);
    setCreatedChatId(null);
    try {
      const attachmentUrls: string[] = [];
      for (const file of offerFiles) {
        const safeName = file.name.replace(/\s+/g, "-");
        const storagePath = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("offer-files")
          .upload(storagePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("offer-files").getPublicUrl(storagePath);
        attachmentUrls.push(data.publicUrl);
      }

      const { data: offerRow, error: offerError } = await supabase
        .from("offers")
        .insert({
          project_id: selectedProject.id,
          contractor_id: user.id,
          owner_id: selectedProject.owner_id,
          price_chf: parsedPrice,
          message: offerMessage.trim(),
          attachments: attachmentUrls,
          status: "submitted",
        })
        .select("id")
        .single();
      if (offerError || !offerRow) throw offerError || new Error(t("dashboard.offer_submit_error"));

      const { data: existingChat } = await supabase
        .from("chats")
        .select("id")
        .eq("project_id", selectedProject.id)
        .eq("owner_id", selectedProject.owner_id)
        .eq("contractor_id", user.id)
        .maybeSingle();

      let chatId = existingChat?.id ?? null;
      if (!chatId) {
        const { data: chatRow, error: chatError } = await supabase
          .from("chats")
          .insert({
            project_id: selectedProject.id,
            offer_id: offerRow.id,
            owner_id: selectedProject.owner_id,
            contractor_id: user.id,
            owner_company_name: selectedProject.owner_company_name,
            contractor_company_name: user.companyName,
            project_title: selectedProject.title,
          })
          .select("id")
          .single();
        if (chatError || !chatRow) throw chatError || new Error(t("dashboard.offer_submit_error"));
        chatId = chatRow.id;
      }

      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          message: `Offer submitted: CHF ${parsedPrice.toFixed(2)}\n\n${offerMessage.trim()}`,
          attachments: attachmentUrls,
        });
      if (messageError) throw messageError;

      await supabase.rpc("increment_offer_count", { user_id: user.id });

      await refreshUser();
      setOfferSuccess(t("dashboard.offer_submit_success"));
      setCreatedChatId(chatId);
      setOfferPrice("");
      setOfferMessage("");
      setOfferFiles([]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("dashboard.offer_submit_error"));
    } finally {
      setOfferSubmitting(false);
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
            {editingProjectId && (
              <p className="mt-2 text-xs font-medium text-primary">{t("dashboard.editing_project_mode")}</p>
            )}
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
            {isCustomCategory && (
              <div className="grid gap-2">
                <Label htmlFor="project-custom-category">Custom category</Label>
                <Input
                  id="project-custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Solar panels, Roofing, Smart home"
                  required
                />
              </div>
            )}

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
                {submitting
                  ? "..."
                  : editingProjectId
                    ? t("dashboard.update_project")
                    : t("dashboard.publish_project")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetOwnerForm}
              >
                {t("dashboard.clear_form")}
              </Button>
            </div>
          </form>

          {successMessage && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
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

      {isContractor && selectedProject && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold text-foreground">{t("dashboard.submit_offer")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedProject.title} · {selectedProject.address}
          </p>

          <form className="mt-5 grid gap-4" onSubmit={handleOfferSubmit}>
            <div className="grid gap-2">
              <Label>{t("auth.full_name")}</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.company_name")}</Label>
              <Input value={user?.companyName || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>{t("auth.email")}</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>{t("dashboard.offer_price_chf")}</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="15000"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("dashboard.offer_message")}</Label>
              <Textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder={t("dashboard.offer_message_placeholder")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-files">{t("dashboard.offer_files")}</Label>
              <label htmlFor="offer-files" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4 text-sm text-muted-foreground hover:bg-muted">
                <UploadCloud className="h-4 w-4" />
                {t("dashboard.offer_files_hint")}
              </label>
              <input
                id="offer-files"
                type="file"
                className="hidden"
                multiple
                onChange={(e) => setOfferFiles(Array.from(e.target.files || []))}
              />
              {offerFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.files_selected", { count: offerFiles.length })}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!canSubmitOffer || offerSubmitting}>
                {offerSubmitting ? "..." : t("dashboard.submit_offer")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedProject(null);
                  setOfferPrice("");
                  setOfferMessage("");
                  setOfferFiles([]);
                  setOfferSuccess(null);
                  setCreatedChatId(null);
                }}
              >
                {t("dashboard.clear_form")}
              </Button>
              {createdChatId && (
                <Button type="button" variant="outline" asChild>
                  <Link to={`/${lang}/dashboard/chats?chat=${createdChatId}`}>{t("dashboard.open_chat")}</Link>
                </Button>
              )}
            </div>
          </form>

          {offerSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {offerSuccess}
            </div>
          )}
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
            <div
              key={p.id}
              id={`project-card-${p.id}`}
              className={`rounded-lg transition-all ${
                highlightedProjectId === p.id ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""
              }`}
            >
              <ProjectCard
                company={p.owner_company_name || t("nav.projects")}
                description={p.title}
                location={p.address}
                deadline={p.deadline}
                publishedAt={p.created_at}
                attachments={p.attachments}
                projectId={p.id}
                ownerId={p.owner_id}
                projectType={p.custom_category || categoryLabelMap[p.category] || p.category}
                owner={{
                  company_name: p.owner_company_name,
                  profile_title: p.owner_profile_title,
                  avatar_url: p.owner_avatar_url,
                }}
                bookmarked={bookmarkedProjectIds.includes(p.id)}
                onToggleBookmark={() => {
                  void toggleBookmark(p.id);
                }}
                actions={
                  isContractor ? (
                    <Button
                      size="sm"
                      disabled={!canSubmitOffer}
                      onClick={() => {
                        setSelectedProject(p);
                        setOfferSuccess(null);
                        setCreatedChatId(null);
                        setActionError(null);
                      }}
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
                  ) : isOwner ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleEditProject(p);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        {t("dashboard.edit_project")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setProjectToDelete(p);
                        }}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t("dashboard.delete_project")}
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            </div>
          ))}
      </div>

      <AlertDialog
        open={Boolean(projectToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingProject) {
            setProjectToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.delete_project_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dashboard.delete_project_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProject}>
              {t("dashboard.delete_project_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (projectToDelete) {
                  void handleDeleteProject(projectToDelete);
                }
              }}
            >
              {deletingProject ? "..." : t("dashboard.delete_project_confirm_button")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardProjects;
