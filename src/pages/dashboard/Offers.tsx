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
  Phone,
  Search,
  Send,
  ShieldBan,
  Star,
  Trash2,
  Video,
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
import { VerificationBadge } from "@/components/common/VerificationBadge";
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
  project_id: string;
  owner_id: string;
  contractor_id: string;
  owner_company_name: string | null;
  contractor_company_name: string | null;
  project_title: string | null;
  updated_at: string;
}

interface OfferNegotiationItem {
  id: string;
  project_id: string;
  owner_id: string;
  contractor_id: string;
  price_chf: number;
  message: string;
  status: "submitted" | "accepted" | "rejected";
  created_at: string;
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
  is_verified?: boolean;
  last_login_at?: string | null;
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

interface NotificationLite {
  id: string;
  meta: { chat_id?: string } | null;
  type: "project" | "message";
  is_read: boolean;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];

const formatChatTime = (value: string, locale: string) => {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
};

const formatMessageDayLabel = (value: string, locale: string) => {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
};

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
  const { user, offerLimit, getToken } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const isContractor = user?.role === "contractor";
  const isActive = user?.subscriptionStatus === "active";
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(searchParams.get("chat"));
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [unreadByChatId, setUnreadByChatId] = useState<Record<string, number>>({});
  const [typingByChatId, setTypingByChatId] = useState<Record<string, boolean>>({});
  const [onlineByChatId, setOnlineByChatId] = useState<Record<string, boolean>>({});
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [chatSettingsById, setChatSettingsById] = useState<Record<string, ChatSetting>>({});
  const [blockedByMeIds, setBlockedByMeIds] = useState<string[]>([]);
  const [blockedMeIds, setBlockedMeIds] = useState<string[]>([]);
  const [confirmDeleteChatOpen, setConfirmDeleteChatOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [processingChatAction, setProcessingChatAction] = useState(false);
  const [latestOffer, setLatestOffer] = useState<OfferNegotiationItem | null>(null);
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");
  const [negotiating, setNegotiating] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  const loadUnreadByChat = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, meta, is_read")
      .eq("user_id", user.id)
      .eq("type", "message")
      .eq("is_read", false);
    const rows = (data ?? []) as NotificationLite[];
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      const chatId = row.meta?.chat_id;
      if (!chatId) return acc;
      acc[chatId] = (acc[chatId] ?? 0) + 1;
      return acc;
    }, {});
    setUnreadByChatId(counts);
  }, [user]);

  const markChatNotificationsRead = useCallback(async (chatId: string) => {
    if (!user || !chatId) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, meta, type, is_read")
      .eq("user_id", user.id)
      .eq("type", "message")
      .eq("is_read", false);
    const idsToMark = ((data ?? []) as NotificationLite[])
      .filter((row) => row.meta?.chat_id === chatId)
      .map((row) => row.id);
    if (idsToMark.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", idsToMark);
    setUnreadByChatId((prev) => ({ ...prev, [chatId]: 0 }));
  }, [user]);

  const loadChats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("id, project_id, owner_id, contractor_id, owner_company_name, contractor_company_name, project_title, updated_at")
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

  const loadLatestOffer = useCallback(async (chat: ChatItem | null) => {
    if (!chat) {
      setLatestOffer(null);
      return;
    }
    const { data } = await supabase
      .from("offers")
      .select("id, project_id, owner_id, contractor_id, price_chf, message, status, created_at")
      .eq("project_id", chat.project_id)
      .eq("owner_id", chat.owner_id)
      .eq("contractor_id", chat.contractor_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatestOffer((data ?? null) as OfferNegotiationItem | null);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadChats();
    void loadBlocks();
    void loadUnreadByChat();
  }, [loadBlocks, loadChats, loadUnreadByChat, user]);

  useEffect(() => {
    void loadMessages(selectedChatId);
  }, [loadMessages, selectedChatId]);

  useEffect(() => {
    const chat = chats.find((item) => item.id === selectedChatId) ?? null;
    void loadLatestOffer(chat);
  }, [chats, loadLatestOffer, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;
    void markChatNotificationsRead(selectedChatId);
  }, [markChatNotificationsRead, selectedChatId]);

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          void loadUnreadByChat();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBlocks, loadChats, loadMessages, loadUnreadByChat, selectedChatId, user]);

  useEffect(() => {
    if (!user || !selectedChatId) return;
    if (presenceChannelRef.current) {
      void supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }

    const channel = supabase.channel(`chat-presence-${selectedChatId}`, {
      config: { presence: { key: user.id } },
    });
    presenceChannelRef.current = channel;

    const syncPresence = () => {
      const state = channel.presenceState<Record<string, unknown>>();
      const participants = Object.values(state).flat();
      const hasOnlineCounterparty = participants.some((presence) => {
        const userId = String((presence as { user_id?: string }).user_id ?? "");
        return Boolean(userId) && userId !== user.id;
      });
      const hasTypingCounterparty = participants.some((presence) => {
        const userId = String((presence as { user_id?: string }).user_id ?? "");
        const isTyping = Boolean((presence as { typing?: boolean }).typing);
        return Boolean(userId) && userId !== user.id && isTyping;
      });
      setOnlineByChatId((prev) => ({ ...prev, [selectedChatId]: hasOnlineCounterparty }));
      setTypingByChatId((prev) => ({ ...prev, [selectedChatId]: hasTypingCounterparty }));
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            typing: Boolean(newMessage.trim()),
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      setTypingByChatId((prev) => ({ ...prev, [selectedChatId]: false }));
      setOnlineByChatId((prev) => ({ ...prev, [selectedChatId]: false }));
      void supabase.removeChannel(channel);
      if (presenceChannelRef.current === channel) presenceChannelRef.current = null;
    };
  }, [newMessage, selectedChatId, user]);

  useEffect(() => {
    if (!selectedChatId || !presenceChannelRef.current || !user) return;
    void presenceChannelRef.current.track({
      user_id: user.id,
      typing: Boolean(newMessage.trim()),
      online_at: new Date().toISOString(),
    });
  }, [newMessage, selectedChatId, user]);

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
      .select("id, name, company_name, avatar_url, profile_title, is_verified, last_login_at")
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
            is_verified: Boolean(profile.is_verified),
            last_login_at: profile.last_login_at ?? null,
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
  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return sortedChats;
    return sortedChats.filter((chat) => {
      const partnerId = user?.id === chat.owner_id ? chat.contractor_id : chat.owner_id;
      const partner = profilesById[partnerId];
      const label =
        partner?.company_name ||
        (user?.role === "project_owner" ? chat.contractor_company_name : chat.owner_company_name) ||
        "";
      const subtitle = partner?.profile_title || chat.project_title || "";
      return (
        label.toLowerCase().includes(q) ||
        subtitle.toLowerCase().includes(q) ||
        partner?.name?.toLowerCase().includes(q)
      );
    });
  }, [chatSearch, sortedChats, user?.id, user?.role, profilesById]);
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
  const isCounterpartyTyping = selectedChatId ? Boolean(typingByChatId[selectedChatId]) : false;
  const isCounterpartyOnline = selectedChatId ? Boolean(onlineByChatId[selectedChatId]) : false;
  const groupedMessages = useMemo(() => {
    const grouped: Array<
      | { type: "day"; id: string; label: string }
      | { type: "message"; id: string; message: ChatMessageItem }
    > = [];
    let currentDay = "";
    messages.forEach((message) => {
      const dayKey = new Date(message.created_at).toDateString();
      if (dayKey !== currentDay) {
        currentDay = dayKey;
        grouped.push({
          type: "day",
          id: `day-${dayKey}`,
          label: formatMessageDayLabel(message.created_at, lang),
        });
      }
      grouped.push({ type: "message", id: message.id, message });
    });
    return grouped;
  }, [lang, messages]);

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

  const sendSystemChatMessage = useCallback(async (text: string) => {
    if (!user || !selectedChatId) return;
    const { error } = await supabase.from("chat_messages").insert({
      chat_id: selectedChatId,
      sender_id: user.id,
      message: text,
      attachments: [],
    });
    if (error) throw error;
  }, [selectedChatId, user]);

  const handleOfferDecision = async (action: "accept" | "reject") => {
    if (!latestOffer || !selectedChatId) return;
    setNegotiating(true);
    setComposerError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expired. Please sign in again.");
      const response = await fetch("/api/offers/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          offerId: latestOffer.id,
          chatId: selectedChatId,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to process offer action");
      await loadLatestOffer(selectedChat);
      await loadMessages(selectedChatId);
      await loadChats();
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : "Failed to process offer action");
    } finally {
      setNegotiating(false);
    }
  };

  const handleSendProposal = async () => {
    if (!user || !selectedChat) return;
    const amount = Number(proposalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setComposerError("Please enter a valid amount for the proposal.");
      return;
    }
    setNegotiating(true);
    setComposerError(null);
    try {
      if (user.role === "contractor" && isActive) {
        const token = await getToken();
        if (!token) throw new Error("Session expired. Please sign in again.");
        const response = await fetch("/api/offers/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: selectedChat.project_id,
            ownerId: selectedChat.owner_id,
            priceChf: amount,
            content: proposalMessage.trim() || `Counter offer proposal: CHF ${amount.toFixed(2)}`,
            attachments: [],
            projectTitle: selectedChat.project_title ?? "",
            ownerCompanyName: selectedChat.owner_company_name ?? "",
            contractorCompanyName: selectedChat.contractor_company_name ?? "",
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || payload.message || "Failed to send proposal as offer");
      } else {
        await sendSystemChatMessage(
          `Counter proposal: CHF ${amount.toFixed(2)}${proposalMessage.trim() ? `\n\n${proposalMessage.trim()}` : ""}`,
        );
      }
      setProposalAmount("");
      setProposalMessage("");
      await loadLatestOffer(selectedChat);
      await loadMessages(selectedChatId);
      await loadChats();
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : "Failed to send proposal");
    } finally {
      setNegotiating(false);
    }
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

      <div className="mt-8 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_260px]">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t("dashboard.messages")}</p>
            <Badge variant="secondary">{chats.length}</Badge>
          </div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="pl-9"
              placeholder="Search chats..."
            />
          </div>
          <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1">
            {filteredChats.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                {t("dashboard.no_chats")}
              </p>
            )}
            {filteredChats.map((chat) => {
              const partnerId = user?.id === chat.owner_id ? chat.contractor_id : chat.owner_id;
              const partner = profilesById[partnerId];
              const label =
                partner?.company_name ||
                (user?.role === "project_owner" ? chat.contractor_company_name : chat.owner_company_name);
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
                    void markChatNotificationsRead(chat.id);
                  }}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    chat.id === selectedChatId
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="mt-0.5 h-9 w-9 border border-border">
                      <AvatarImage src={partner?.avatar_url || undefined} alt={label || "Chat"} />
                      <AvatarFallback>{partnerInitial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1 truncate font-medium text-foreground">
                          {label || "Chat"}
                          {onlineByChatId[chat.id] && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          )}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatChatTime(chat.updated_at, lang)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                      <div className="mt-1 flex items-center gap-1">
                        {chatSettings?.is_favorite && (
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                        {chatSettings?.is_muted && (
                          <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {(unreadByChatId[chat.id] ?? 0) > 0 && (
                          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {unreadByChatId[chat.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          {!selectedChat && (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.no_chats")}</p>
            </div>
          )}
          {selectedChat && (
            <>
              <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {counterpartyProfile?.company_name ||
                          (user?.role === "project_owner"
                            ? selectedChat.contractor_company_name
                            : selectedChat.owner_company_name)}
                      </p>
                      <VerificationBadge verified={Boolean(counterpartyProfile?.is_verified)} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isCounterpartyTyping
                        ? "typing..."
                        : isCounterpartyOnline
                          ? "online"
                          : `last seen ${formatChatTime(
                            counterpartyProfile?.last_login_at || selectedChat.updated_at,
                            lang,
                          )}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    {t("subscription.active_status")}
                  </Badge>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
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
              <div className="h-[460px] space-y-3 overflow-y-auto bg-gradient-to-b from-muted/20 to-background p-4">
                {groupedMessages.map((entry) => (
                  entry.type === "day" ? (
                    <div key={entry.id} className="py-1 text-center">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        {entry.label}
                      </span>
                    </div>
                  ) : (
                  <div key={entry.id} className={cn("flex", entry.message.sender_id === user?.id ? "justify-end" : "justify-start")}>
                    <div className="max-w-[88%]">
                      <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Avatar className="h-5 w-5 border border-border">
                          <AvatarImage
                            src={
                              entry.message.sender_id === user?.id
                                ? currentProfile?.avatar_url || undefined
                                : counterpartyProfile?.avatar_url || undefined
                            }
                          />
                          <AvatarFallback>
                            {(
                              (entry.message.sender_id === user?.id
                                ? currentProfile?.name || currentProfile?.company_name
                                : counterpartyProfile?.name || counterpartyProfile?.company_name) || "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {entry.message.sender_id === user?.id
                            ? t("nav.dashboard")
                            : counterpartyProfile?.company_name || "Partner"}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm shadow-sm",
                          entry.message.sender_id === user?.id
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border border-border bg-card text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{entry.message.message}</p>
                        {entry.message.attachments && entry.message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {entry.message.attachments.map((url) =>
                              renderAttachment(url, entry.message.sender_id === user?.id),
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-right text-[11px] text-muted-foreground">
                        {new Date(entry.message.created_at).toLocaleString(lang, {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  )
                ))}
                <div ref={endOfMessagesRef} />
              </div>
              <form className="space-y-2 border-t border-border bg-background p-3" onSubmit={handleSendMessage}>
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
                    size="icon"
                    variant="outline"
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={!canSendMessage}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setChatFiles(Array.from(e.target.files || []))}
                    disabled={!canSendMessage}
                  />
                  <Button type="submit" size="icon" disabled={!canSendMessage || sending || (!newMessage.trim() && chatFiles.length === 0)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {chatFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chatFiles.map((file) => (
                      <span key={file.name} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
                {composerError && (
                  <p className="text-xs text-destructive">{composerError}</p>
                )}
              </form>
            </>
          )}
        </div>

        <div className="hidden rounded-xl border border-border bg-card p-3 shadow-sm xl:block">
          <p className="mb-3 text-sm font-semibold text-foreground">Chat details</p>
          {!selectedChat && (
            <p className="text-xs text-muted-foreground">Select a conversation to see details.</p>
          )}
          {selectedChat && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={counterpartyProfile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(counterpartyProfile?.name || counterpartyProfile?.company_name || "C").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {counterpartyProfile?.company_name || "Partner"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {counterpartyProfile?.profile_title || selectedChat.project_title || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Project</p>
                <p className="mt-1">{selectedChat.project_title || "-"}</p>
              </div>

              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => void handleToggleFavorite()}>
                  <Star className={cn("mr-2 h-4 w-4", selectedChatSettings?.is_favorite && "fill-yellow-400 text-yellow-400")} />
                  {selectedChatSettings?.is_favorite ? t("dashboard.chat_unfavorite") : t("dashboard.chat_favorite")}
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => void handleToggleMute()}>
                  <BellOff className="mr-2 h-4 w-4" />
                  {selectedChatSettings?.is_muted ? t("dashboard.chat_unmute") : t("dashboard.chat_mute")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    if (isBlockedByMe) {
                      void handleToggleBlock();
                      return;
                    }
                    setConfirmBlockOpen(true);
                  }}
                >
                  <ShieldBan className="mr-2 h-4 w-4" />
                  {isBlockedByMe ? t("dashboard.chat_unblock") : t("dashboard.chat_block")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setConfirmDeleteChatOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("dashboard.chat_delete_for_me")}
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offer negotiation</p>
                {!latestOffer ? (
                  <p className="mt-2 text-xs text-muted-foreground">No offer submitted yet.</p>
                ) : (
                  <div className="mt-2 space-y-2 text-xs">
                    <p className="font-medium text-foreground">Latest offer: CHF {Number(latestOffer.price_chf).toFixed(2)}</p>
                    <p className="text-muted-foreground">Status: {latestOffer.status}</p>
                    <p className="line-clamp-3 text-muted-foreground">{latestOffer.message}</p>
                    {user?.role === "project_owner" && latestOffer.status === "submitted" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8" disabled={negotiating} onClick={() => void handleOfferDecision("accept")}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-8" disabled={negotiating} onClick={() => void handleOfferDecision("reject")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Proposal amount (CHF)"
                    value={proposalAmount}
                    onChange={(e) => setProposalAmount(e.target.value)}
                    disabled={negotiating}
                  />
                  <Input
                    placeholder="Optional note for proposal"
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    disabled={negotiating}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={negotiating || !proposalAmount.trim() || (user?.role === "contractor" && !isActive)}
                    onClick={() => void handleSendProposal()}
                  >
                    {user?.role === "contractor" ? "Send as official offer" : "Send counter proposal"}
                  </Button>
                  {user?.role === "contractor" && !isActive && (
                    <p className="text-[11px] text-muted-foreground">
                      Active subscription is required to submit an official offer.
                    </p>
                  )}
                </div>
              </div>
            </div>
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
