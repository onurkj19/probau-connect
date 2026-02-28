import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bookmark, Building2, CalendarClock, Clock, Download, ExternalLink, FileText, MapPin, Paperclip } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/time";
import { VerificationBadge } from "@/components/common/VerificationBadge";

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
  is_verified: boolean | null;
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];

const getFileNameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(url.split("/").pop() || "file");
  } catch {
    return url.split("/").pop() || "file";
  }
};

const getFileExtension = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  const ext = fileName.split(".").pop();
  return ext ? ext.toLowerCase() : "";
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
        .select("company_name, profile_title, avatar_url, is_verified")
        .eq("id", ownerId)
        .maybeSingle();

      if (!isCancelled && data) {
        setOwnerSnapshot({
          company_name: data.company_name,
          profile_title: data.profile_title,
          avatar_url: data.avatar_url,
          is_verified: data.is_verified ?? false,
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

  const displayCompany = ownerSnapshot?.company_name || owner?.company_name || company;
  const displayProfileTitle = ownerSnapshot?.profile_title || owner?.profile_title || null;
  const displayAvatarUrl = ownerSnapshot?.avatar_url || owner?.avatar_url || null;
  const isOwnerVerified = Boolean(ownerSnapshot?.is_verified);
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

  const renderProjectAttachment = (url: string) => {
    const ext = getFileExtension(url);
    const fileName = getFileNameFromUrl(url);
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const isPdf = ext === "pdf";
    const isVideo = VIDEO_EXTENSIONS.includes(ext);
    const isAudio = AUDIO_EXTENSIONS.includes(ext);

    if (isImage) {
      return (
        <div key={url} className="space-y-1 rounded-md border border-border/60 bg-background p-2">
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={fileName} className="max-h-52 w-full rounded-md object-cover" />
          </a>
          <div className="flex items-center gap-3 text-xs">
            <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
              <ExternalLink className="mr-1 inline h-3 w-3" />
              Open
            </a>
            <a href={url} download className="text-primary underline">
              <Download className="mr-1 inline h-3 w-3" />
              Download
            </a>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div key={url} className="space-y-1 rounded-md border border-border/60 bg-background p-2">
          <object data={url} type="application/pdf" className="h-52 w-full rounded-md bg-background" />
          <div className="flex items-center gap-3 text-xs">
            <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
              <ExternalLink className="mr-1 inline h-3 w-3" />
              Open PDF
            </a>
            <a href={url} download className="text-primary underline">
              <Download className="mr-1 inline h-3 w-3" />
              Download
            </a>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div key={url} className="space-y-1 rounded-md border border-border/60 bg-background p-2">
          <video controls className="max-h-52 w-full rounded-md">
            <source src={url} />
          </video>
          <a href={url} download className="text-xs text-primary underline">
            <Download className="mr-1 inline h-3 w-3" />
            Download
          </a>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div key={url} className="space-y-1 rounded-md border border-border/60 bg-background p-2">
          <audio controls className="w-full">
            <source src={url} />
          </audio>
          <a href={url} download className="text-xs text-primary underline">
            <Download className="mr-1 inline h-3 w-3" />
            Download
          </a>
        </div>
      );
    }

    return (
      <div key={url} className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1 text-xs">
        <span className="truncate">{fileName}</span>
        <div className="ml-2 shrink-0 space-x-3">
          <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
            Open
          </a>
          <a href={url} download className="text-primary underline">
            Download
          </a>
        </div>
      </div>
    );
  };

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
              <VerificationBadge verified={isOwnerVerified} />
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
          <div className="space-y-2">
            {fileLinks.map((url) => (
              <div key={url}>
                {renderProjectAttachment(url)}
              </div>
            ))}
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
