import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  BellOff,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Send,
  ShieldBan,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatItem {
  id: string;
  owner_id: string;
  contractor_id: string;
  owner_company_name: string | null;
  contractor_company_name: string | null;
  project_title: string | null;
  updated_at: string;
}

interface ChatMessageItem {
  id: string;
  sender_id: string;
  message: string;
  attachments: string[] | null;
  created_at: string;
}

interface ProfileLite {
  id: string;
  name: string;
  company_name: string;
  avatar_url: string | null;
  profile_title: string | null;
}

interface ChatSetting {
  chat_id: string;
  is_muted: boolean;
  is_favorite: boolean;
  is_hidden: boolean;
}

interface BlockedUserRow {
  blocker_id: string;
  blocked_id: string;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];

const getFileNameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(url.split("/").pop() || "attachment");
  } catch {
    return url.split("/").pop() || "attachment";
  }
};

const getFileExtension = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  const ext = fileName.split(".").pop();
  return ext ? ext.toLowerCase() : "";
};

const DashboardOffers = () => {
  const { t } = useTranslation();
  const { user, offerLimit } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const isContractor = user?.role === "contractor";
  const isActive = user?.subscriptionStatus === "active";
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(searchParams.get("chat"));
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [chatSettingsById, setChatSettingsById] = useState<Record<string, ChatSetting>>({});
  const [blockedByMeIds, setBlockedByMeIds] = useState<string[]>([]);
  const [blockedMeIds, setBlockedMeIds] = useState<string[]>([]);
  const [confirmDeleteChatOpen, setConfirmDeleteChatOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [processingChatAction, setProcessingChatAction] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadBlocks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("blocked_users")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

    const rows = (data ?? []) as BlockedUserRow[];
    setBlockedByMeIds(rows.filter((row) => row.blocker_id === user.id).map((row) => row.blocked_id));
    setBlockedMeIds(rows.filter((row) => row.blocked_id === user.id).map((row) => row.blocker_id));
  }, [user]);

  const loadChats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("id, owner_id, contractor_id, owner_company_name, contractor_company_name, project_title, updated_at")
      .or(`owner_id.eq.${user.id},contractor_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    const rows = (data ?? []) as ChatItem[];
    let settingsMap: Record<string, ChatSetting> = {};
    if (rows.length > 0) {
      const { data: settingsData } = await supabase
        .from("chat_user_settings")
        .select("chat_id, is_muted, is_favorite, is_hidden")
        .eq("user_id", user.id)
        .in("chat_id", rows.map((row) => row.id));

      settingsMap = (settingsData ?? []).reduce<Record<string, ChatSetting>>((acc, row) => {
        acc[row.chat_id] = row as ChatSetting;
        return acc;
      }, {});
    }

    setChatSettingsById(settingsMap);
    const visibleRows = rows.filter((chat) => !settingsMap[chat.id]?.is_hidden);
    setChats(visibleRows);

    setSelectedChatId((current) => {
      if (current && visibleRows.some((chat) => chat.id === current)) {
        return current;
      }
      return visibleRows[0]?.id ?? null;
    });
  }, [user]);

  const loadMessages = useCallback(async (chatId: string | null) => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, message, attachments, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as ChatMessageItem[]);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadChats();
    void loadBlocks();
  }, [loadBlocks, loadChats, user]);

  useEffect(() => {
    void loadMessages(selectedChatId);
  }, [loadMessages, selectedChatId]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          void loadChats();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          void loadMessages(selectedChatId);
          void loadChats();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_user_settings" },
        () => {
          void loadChats();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_users" },
        () => {
          void loadBlocks();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBlocks, loadChats, loadMessages, selectedChatId, user]);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get("chat");
    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!chats.length) return;
    const ids = Array.from(
      new Set(
        chats
          .flatMap((chat) => [chat.owner_id, chat.contractor_id])
          .filter((id): id is string => Boolean(id)),
      ),
    );
    if (!ids.length) return;

    void supabase
      .from("profiles")
      .select("id, name, company_name, avatar_url, profile_title")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, ProfileLite> = {};
        (data ?? []).forEach((profile) => {
          map[profile.id] = {
            id: profile.id,
            name: profile.name,
            company_name: profile.company_name,
            avatar_url: profile.avatar_url,
            profile_title: profile.profile_title,
          };
        });
        setProfilesById(map);
      });
  }, [chats]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );
  const sortedChats = useMemo(() => {
    const copy = [...chats];
    copy.sort((a, b) => {
      const aFav = chatSettingsById[a.id]?.is_favorite ? 1 : 0;
      const bFav = chatSettingsById[b.id]?.is_favorite ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return copy;
  }, [chatSettingsById, chats]);
  const counterpartyId = selectedChat
    ? selectedChat.owner_id === user?.id
      ? selectedChat.contractor_id
      : selectedChat.owner_id
    : null;
  const counterpartyProfile = counterpartyId ? profilesById[counterpartyId] : null;
  const currentProfile =
    user && profilesById[user.id]
      ? profilesById[user.id]
      : user
        ? {
            id: user.id,
            name: user.name,
            company_name: user.companyName,
            avatar_url: user.avatarUrl || null,
            profile_title: user.profileTitle || null,
          }
        : null;
  const isBlockedByMe = counterpartyId ? blockedByMeIds.includes(counterpartyId) : false;
  const isBlockedByOther = counterpartyId ? blockedMeIds.includes(counterpartyId) : false;
  const selectedChatSettings = selectedChatId ? chatSettingsById[selectedChatId] : undefined;
  const canSendMessage = Boolean(selectedChatId) && !isBlockedByMe && !isBlockedByOther;

  const upsertChatSetting = async (
    chatId: string,
    patch: Partial<Pick<ChatSetting, "is_muted" | "is_favorite" | "is_hidden">>,
  ) => {
    if (!user) return;
    const current = chatSettingsById[chatId];
    const payload = {
      chat_id: chatId,
      user_id: user.id,
      is_muted: patch.is_muted ?? current?.is_muted ?? false,
      is_favorite: patch.is_favorite ?? current?.is_favorite ?? false,
      is_hidden: patch.is_hidden ?? current?.is_hidden ?? false,
    };

    const { error } = await supabase
      .from("chat_user_settings")
      .upsert(payload, { onConflict: "chat_id,user_id" });
    if (error) throw error;

    setChatSettingsById((prev) => ({
      ...prev,
      [chatId]: { chat_id: chatId, ...payload },
    }));
  };

  const handleToggleFavorite = async () => {
    if (!selectedChatId) return;
    try {
      await upsertChatSetting(selectedChatId, {
        is_favorite: !Boolean(selectedChatSettings?.is_favorite),
      });
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : t("dashboard.chat_action_error"));
    }
  };

  const handleToggleMute = async () => {
    if (!selectedChatId) return;
    try {
      await upsertChatSetting(selectedChatId, {
        is_muted: !Boolean(selectedChatSettings?.is_muted),
      });
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : t("dashboard.chat_action_error"));
    }
  };

  const handleDeleteChatForMe = async () => {
    if (!selectedChatId) return;
    setProcessingChatAction(true);
    try {
      await upsertChatSetting(selectedChatId, { is_hidden: true });
      setConfirmDeleteChatOpen(false);
      await loadChats();
      await loadMessages(null);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : t("dashboard.chat_action_error"));
    } finally {
      setProcessingChatAction(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !counterpartyId) return;
    setProcessingChatAction(true);
    try {
      if (isBlockedByMe) {
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", counterpartyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blocked_users")
          .insert({ blocker_id: user.id, blocked_id: counterpartyId });
        if (error) throw error;
      }
      setConfirmBlockOpen(false);
      await loadBlocks();
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : t("dashboard.chat_action_error"));
    } finally {
      setProcessingChatAction(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChatId) return;
    if (!canSendMessage) {
      setComposerError(
        isBlockedByOther
          ? t("dashboard.chat_blocked_by_other_notice")
          : t("dashboard.chat_blocked_notice"),
      );
      return;
    }
    if (!newMessage.trim() && chatFiles.length === 0) return;
    setSending(true);
    setComposerError(null);
    try {
      const attachments: string[] = [];
      for (const file of chatFiles) {
        const safeName = file.name.replace(/\s+/g, "-");
        const path = `${user.id}/${Date.now()}-${safeName}`;

        let uploadError: { message: string } | null = null;
        const uploadToBucket = async (bucket: string) => {
          const result = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
          uploadError = result.error ? { message: result.error.message } : null;
          if (!result.error) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            attachments.push(data.publicUrl);
          }
        };

        await uploadToBucket("chat-files");
        if (uploadError) {
          await uploadToBucket("offer-files");
        }
        if (uploadError) throw new Error(uploadError.message);
      }

      const { error } = await supabase.from("chat_messages").insert({
        chat_id: selectedChatId,
        sender_id: user.id,
        message: newMessage.trim() || t("dashboard.chat_attachment_message"),
        attachments,
      });
      if (error) throw error;

      setNewMessage("");
      setChatFiles([]);
      if (chatFileInputRef.current) chatFileInputRef.current.value = "";
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const renderAttachment = (url: string, isMine: boolean) => {
    const ext = getFileExtension(url);
    const fileName = getFileNameFromUrl(url);
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const isPdf = ext === "pdf";
    const isVideo = VIDEO_EXTENSIONS.includes(ext);
    const isAudio = AUDIO_EXTENSIONS.includes(ext);
    const linkClass = cn(
      "text-xs underline",
      isMine ? "text-primary-foreground/90" : "text-primary",
    );

    if (isImage) {
      return (
        <div key={url} className="space-y-1">
          <a href={url} target="_blank" rel="noreferrer">
            <img
              src={url}
              alt={fileName}
              className="max-h-64 rounded-lg border border-border/30 object-cover"
            />
          </a>
          <div className="flex items-center gap-3">
            <a href={url} target="_blank" rel="noreferrer" className={linkClass}>
              <ExternalLink className="mr-1 inline h-3 w-3" />
              Open
            </a>
            <a href={url} download className={linkClass}>
              <Download className="mr-1 inline h-3 w-3" />
              Download
            </a>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div key={url} className="space-y-2">
          <object
            data={url}
            type="application/pdf"
            className="h-56 w-full rounded-lg border border-border/40 bg-background"
          />
          <div className="flex items-center gap-3">
            <a href={url} target="_blank" rel="noreferrer" className={linkClass}>
              <ExternalLink className="mr-1 inline h-3 w-3" />
              Open PDF
            </a>
            <a href={url} download className={linkClass}>
              <Download className="mr-1 inline h-3 w-3" />
              Download
            </a>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div key={url} className="space-y-2">
          <video controls className="max-h-64 w-full rounded-lg border border-border/30">
            <source src={url} />
          </video>
          <a href={url} download className={linkClass}>
            <Download className="mr-1 inline h-3 w-3" />
            Download
          </a>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div key={url} className="space-y-2">
          <audio controls className="w-full">
            <source src={url} />
          </audio>
          <a href={url} download className={linkClass}>
            <Download className="mr-1 inline h-3 w-3" />
            Download
          </a>
        </div>
      );
    }

    return (
      <div
        key={url}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md border px-2 py-1.5",
          isMine ? "border-primary-foreground/30 bg-primary-foreground/10" : "border-border/60 bg-background",
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-xs">{fileName}</p>
        </div>
        <a href={url} download className={linkClass}>
          <Download className="mr-1 inline h-3 w-3" />
          Download
        </a>
      </div>
    );
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        {isContractor ? t("dashboard.my_offers") : t("dashboard.messages")}
      </h1>

      {isActive && user?.planType && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatsCard
            title={t("subscription.offers_used")}
            value={offerLimit ? `${user.offerCountThisMonth} / ${offerLimit}` : `${user.offerCountThisMonth}`}
            icon={CreditCard}
            description={offerLimit ? t("subscription.basic_limit") : t("subscription.unlimited")}
          />
          <StatsCard
            title={t("dashboard.subscription")}
            value={t(`pricing.${user.planType}.name`)}
            icon={FileText}
          />
        </div>
      )}

      {isContractor && !isActive && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm font-medium text-yellow-800">{t("dashboard.subscription_required_message")}</p>
          <Button size="sm" className="mt-2" asChild>
            <Link to={`/${lang}/dashboard/subscription`}>{t("dashboard.upgrade_now")}</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-sm font-medium text-foreground">{t("dashboard.messages")}</p>
          <div className="space-y-2">
            {chats.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("dashboard.no_chats")}</p>
            )}
            {sortedChats.map((chat) => {
              const partnerId = user?.id === chat.owner_id ? chat.contractor_id : chat.owner_id;
              const partner = profilesById[partnerId];
              const label =
                partner?.company_name ||
                (user?.role === "owner" ? chat.contractor_company_name : chat.owner_company_name);
              const subtitle = partner?.profile_title || chat.project_title || "-";
              const partnerInitial = (partner?.name || label || "P").charAt(0).toUpperCase();
              const chatSettings = chatSettingsById[chat.id];
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setSearchParams({ chat: chat.id });
                  }}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    chat.id === selectedChatId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={partner?.avatar_url || undefined} alt={label || "Chat"} />
                      <AvatarFallback>{partnerInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {label || "Chat"}
                        {chatSettings?.is_favorite && (
                          <Star className="ml-1 inline h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                        {chatSettings?.is_muted && (
                          <BellOff className="ml-1 inline h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {!selectedChat && (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.no_chats")}</p>
            </div>
          )}
          {selectedChat && (
            <>
              <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage
                      src={counterpartyProfile?.avatar_url || undefined}
                      alt={counterpartyProfile?.company_name || "Chat"}
                    />
                    <AvatarFallback>
                      {(counterpartyProfile?.name || counterpartyProfile?.company_name || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {counterpartyProfile?.company_name ||
                        (user?.role === "owner"
                          ? selectedChat.contractor_company_name
                          : selectedChat.owner_company_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {counterpartyProfile?.profile_title || selectedChat.project_title || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {t("subscription.active_status")}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={() => void handleToggleFavorite()}>
                        <Star className={cn("mr-2 h-4 w-4", selectedChatSettings?.is_favorite && "fill-yellow-400 text-yellow-400")} />
                        {selectedChatSettings?.is_favorite ? t("dashboard.chat_unfavorite") : t("dashboard.chat_favorite")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void handleToggleMute()}>
                        <BellOff className="mr-2 h-4 w-4" />
                        {selectedChatSettings?.is_muted ? t("dashboard.chat_unmute") : t("dashboard.chat_mute")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          if (isBlockedByMe) {
                            void handleToggleBlock();
                            return;
                          }
                          setConfirmBlockOpen(true);
                        }}
                      >
                        <ShieldBan className="mr-2 h-4 w-4" />
                        {isBlockedByMe ? t("dashboard.chat_unblock") : t("dashboard.chat_block")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setConfirmDeleteChatOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("dashboard.chat_delete_for_me")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="max-h-[380px] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.sender_id === user?.id ? "justify-end" : "justify-start")}>
                    <div className="max-w-[88%]">
                      <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage
                            src={
                              message.sender_id === user?.id
                                ? currentProfile?.avatar_url || undefined
                                : counterpartyProfile?.avatar_url || undefined
                            }
                          />
                          <AvatarFallback>
                            {(
                              (message.sender_id === user?.id
                                ? currentProfile?.name || currentProfile?.company_name
                                : counterpartyProfile?.name || counterpartyProfile?.company_name) || "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {message.sender_id === user?.id
                            ? t("nav.dashboard")
                            : counterpartyProfile?.company_name || "Partner"}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm shadow-sm",
                          message.sender_id === user?.id
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border border-border bg-card text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.message}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((url) =>
                              renderAttachment(url, message.sender_id === user?.id),
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-right text-[11px] text-muted-foreground">
                        {new Date(message.created_at).toLocaleString(lang, {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endOfMessagesRef} />
              </div>
              <form className="mt-3 space-y-2" onSubmit={handleSendMessage}>
                {(isBlockedByMe || isBlockedByOther) && (
                  <p className="text-xs font-medium text-destructive">
                    {isBlockedByOther
                      ? t("dashboard.chat_blocked_by_other_notice")
                      : t("dashboard.chat_blocked_notice")}
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("dashboard.type_message")}
                    disabled={!canSendMessage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={!canSendMessage}
                  >
                    <Paperclip className="mr-1 h-4 w-4" />
                    {t("dashboard.chat_attach")}
                  </Button>
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setChatFiles(Array.from(e.target.files || []))}
                    disabled={!canSendMessage}
                  />
                  <Button type="submit" disabled={!canSendMessage || sending || (!newMessage.trim() && chatFiles.length === 0)}>
                    <Send className="mr-1 h-4 w-4" />
                    {t("dashboard.send_message")}
                  </Button>
                </div>
                {chatFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.files_selected", { count: chatFiles.length })}
                  </p>
                )}
                {composerError && (
                  <p className="text-xs text-destructive">{composerError}</p>
                )}
              </form>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDeleteChatOpen} onOpenChange={setConfirmDeleteChatOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.chat_delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dashboard.chat_delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingChatAction}>
              {t("dashboard.chat_action_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={processingChatAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleDeleteChatForMe();
              }}
            >
              {processingChatAction ? "..." : t("dashboard.chat_action_confirm_delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBlockOpen} onOpenChange={setConfirmBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.chat_block_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dashboard.chat_block_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingChatAction}>
              {t("dashboard.chat_action_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={processingChatAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void handleToggleBlock();
              }}
            >
              {processingChatAction ? "..." : t("dashboard.chat_action_confirm_block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardOffers;
