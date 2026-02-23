import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Lock, UploadCloud } from "lucide-react";
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
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("fassade");
  const [service, setService] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const categoryOptions = [
    { value: "fassade", label: t("dashboard.category_fassade") },
    { value: "gerust", label: t("dashboard.category_gerust") },
    { value: "elektriker", label: t("dashboard.category_elektriker") },
    { value: "reinigung", label: t("dashboard.category_reinigung") },
    { value: "heizung", label: t("dashboard.category_heizung") },
    { value: "sanitar", label: t("dashboard.category_sanitar") },
  ];

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !address || !service) return;
    setSubmitted(true);
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
              <Button type="submit">{t("dashboard.publish_project")}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitle("");
                  setAddress("");
                  setCategory("fassade");
                  setService("");
                  setFiles([]);
                  setSubmitted(false);
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
