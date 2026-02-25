import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bookmark, Building2, CalendarClock, Clock, FileText, MapPin, Paperclip } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/time";

interface ProjectCardProps {
  company: string;
  description: string;
  location: string;
  deadline: string;
  actions?: React.ReactNode;
  projectId?: string;
  projectType?: string | null;
  publishedAt?: string | null;
  attachments?: string[] | null;
  ownerId?: string;
  owner?: {
    company_name?: string | null;
    profile_title?: string | null;
    avatar_url?: string | null;
  } | null;
  offerCount?: number | null;
  showVerifiedBadge?: boolean;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
}

type OwnerSnapshot = {
  company_name: string | null;
  profile_title: string | null;
  avatar_url: string | null;
};

export function ProjectCard({
  company,
  description,
  location,
  deadline,
  actions,
  projectId,
  projectType,
  publishedAt,
  attachments,
  ownerId,
  owner,
  offerCount,
  showVerifiedBadge = true,
  bookmarked,
  onToggleBookmark,
}: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const [nowTs, setNowTs] = useState(() => Date.now());
  const deadlineTs = new Date(deadline).getTime();
  const msRemaining = Math.max(0, deadlineTs - nowTs);
  const daysLeft = Math.max(0, Math.ceil(msRemaining / 86400000));
  const isActive = msRemaining > 0;
  const [isBookmarkedLocal, setIsBookmarkedLocal] = useState(false);
  const [ownerSnapshot, setOwnerSnapshot] = useState<OwnerSnapshot | null>(null);
  const [offerCountState, setOfferCountState] = useState<number | null>(offerCount ?? null);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setOfferCountState(offerCount ?? null);
  }, [offerCount]);

  useEffect(() => {
    if (!ownerId) return;
    let isCancelled = false;

    const loadOwner = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("company_name, profile_title, avatar_url")
        .eq("id", ownerId)
        .maybeSingle();

      if (!isCancelled && data) {
        setOwnerSnapshot({
          company_name: data.company_name,
          profile_title: data.profile_title,
          avatar_url: data.avatar_url,
        });
      }
    };

    void loadOwner();
    return () => {
      isCancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    if (!projectId || offerCount !== undefined) return;
    let isCancelled = false;

    const loadOfferCount = async () => {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (!isCancelled) {
        setOfferCountState(count ?? 0);
      }
    };

    void loadOfferCount();
    return () => {
      isCancelled = true;
    };
  }, [projectId, offerCount]);

  const displayCompany = owner?.company_name || ownerSnapshot?.company_name || company;
  const displayProfileTitle = owner?.profile_title || ownerSnapshot?.profile_title || null;
  const displayAvatarUrl = owner?.avatar_url || ownerSnapshot?.avatar_url || null;
  const offerLabel = useMemo(() => {
    if (offerCountState === null || offerCountState === undefined || offerCountState <= 0) {
      return t("projects.no_offers");
    }
    return t("projects.offers_count", { count: offerCountState });
  }, [offerCountState, t]);
  const companyInitial = displayCompany?.charAt(0).toUpperCase() || "P";
  const fileLinks = attachments?.filter((file) => Boolean(file)) ?? [];
  const isBookmarked = bookmarked ?? isBookmarkedLocal;
  const countdownLabel = useMemo(() => {
    if (!isActive) return t("projects.deadline_passed");
    const totalSeconds = Math.floor(msRemaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }, [isActive, msRemaining, t]);
  const publishedLabel = publishedAt
    ? formatRelativeTime(publishedAt, i18n.language)
    : null;

  return (
    <div className="relative rounded-lg border border-border bg-card p-5 shadow-none">
      <button
        type="button"
        onClick={() => {
          if (onToggleBookmark) {
            onToggleBookmark();
            return;
          }
          setIsBookmarkedLocal((prev) => !prev);
        }}
        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Toggle bookmark"
      >
        <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-foreground text-foreground" : ""}`} />
      </button>

      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={displayAvatarUrl || undefined} alt={displayCompany} />
          <AvatarFallback className="bg-primary/10 text-primary">{companyInitial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{displayCompany}</p>
            {showVerifiedBadge && (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700"
              >
                {t("projects.verified")}
              </Badge>
            )}
          </div>
          {displayProfileTitle && (
            <p className="truncate text-xs text-muted-foreground">{displayProfileTitle}</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        {projectType && (
          <Badge variant="secondary" className="mb-2 text-[11px] font-medium">
            {projectType}
          </Badge>
        )}
        <h3 className="font-display text-lg font-semibold text-foreground">{description}</h3>
        {publishedLabel && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {t("projects.published_at", { value: publishedLabel })}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {t("projects.countdown", { value: countdownLabel })}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {offerLabel}
        </span>
      </div>

      {fileLinks.length > 0 && (
        <div className="mt-3 rounded-md border border-border/70 bg-muted/20 p-2">
          <p className="mb-1 text-xs font-medium text-foreground">{t("projects.project_files")}</p>
          <div className="flex flex-wrap gap-2">
            {fileLinks.map((url) => {
              const fileName = decodeURIComponent(url.split("/").pop() || "file");
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:underline"
                >
                  <Paperclip className="h-3 w-3" />
                  {fileName}
                </a>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <StatusBadge
          status={isActive ? "active" : "closed"}
          label={isActive ? t("projects.status_active") : t("projects.status_closed")}
        />
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          {displayCompany}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
}
