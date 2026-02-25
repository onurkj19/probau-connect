import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { FileText, CreditCard, MessageCircle, Paperclip, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let canceled = false;
    const loadChats = async () => {
      const { data } = await supabase
        .from("chats")
        .select("id, owner_id, contractor_id, owner_company_name, contractor_company_name, project_title, updated_at")
        .or(`owner_id.eq.${user.id},contractor_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });
      if (!canceled) {
        const rows = (data ?? []) as ChatItem[];
        setChats(rows);
        if (!selectedChatId && rows.length > 0) {
          setSelectedChatId(rows[0].id);
        }
      }
    };
    void loadChats();
    return () => {
      canceled = true;
    };
  }, [selectedChatId, user]);

  useEffect(() => {
    if (!selectedChatId) return;
    let canceled = false;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_id, message, attachments, created_at")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true });
      if (!canceled) {
        setMessages((data ?? []) as ChatMessageItem[]);
      }
    };
    void loadMessages();
    return () => {
      canceled = true;
    };
  }, [selectedChatId]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          void supabase
            .from("chats")
            .select("id, owner_id, contractor_id, owner_company_name, contractor_company_name, project_title, updated_at")
            .or(`owner_id.eq.${user.id},contractor_id.eq.${user.id}`)
            .order("updated_at", { ascending: false })
            .then(({ data }) => setChats((data ?? []) as ChatItem[]));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          if (!selectedChatId) return;
          void supabase
            .from("chat_messages")
            .select("id, sender_id, message, attachments, created_at")
            .eq("chat_id", selectedChatId)
            .order("created_at", { ascending: true })
            .then(({ data }) => setMessages((data ?? []) as ChatMessageItem[]));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedChatId, user]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChatId) return;
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
        message: newMessage.trim() || "Attachment",
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
            {chats.map((chat) => {
              const partnerId = user?.id === chat.owner_id ? chat.contractor_id : chat.owner_id;
              const partner = profilesById[partnerId];
              const label =
                partner?.company_name ||
                (user?.role === "owner" ? chat.contractor_company_name : chat.owner_company_name);
              const subtitle = partner?.profile_title || chat.project_title || "-";
              const partnerInitial = (partner?.name || label || "P").charAt(0).toUpperCase();
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
                      <p className="truncate font-medium text-foreground">{label || "Chat"}</p>
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
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {t("subscription.active_status")}
                </Badge>
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
                            {message.attachments.map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "flex items-center gap-1 text-xs underline",
                                  message.sender_id === user?.id
                                    ? "text-primary-foreground/90"
                                    : "text-primary",
                                )}
                              >
                                <Paperclip className="h-3 w-3" />
                                {url.split("/").pop() || "attachment"}
                              </a>
                            ))}
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
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("dashboard.type_message")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => chatFileInputRef.current?.click()}
                  >
                    <Paperclip className="mr-1 h-4 w-4" />
                    Attach
                  </Button>
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setChatFiles(Array.from(e.target.files || []))}
                  />
                  <Button type="submit" disabled={sending || (!newMessage.trim() && chatFiles.length === 0)}>
                    <Send className="mr-1 h-4 w-4" />
                    {t("dashboard.send_message")}
                  </Button>
                </div>
                {chatFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {chatFiles.length} file(s) selected
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
    </div>
  );
};

export default DashboardOffers;
