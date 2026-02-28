import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck, Inbox, MessageCircle, FolderOpen } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { Button } from "@/components/ui/button";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  type: "project" | "message";
  meta: { chat_id?: string; project_id?: string } | null;
  is_read: boolean;
  created_at: string;
}

const DashboardNotifications = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingSelected, setMarkingSelected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, type, meta, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as NotificationRow[]);
      setSelectedIds((prev) => prev.filter((id) => (data ?? []).some((row) => row.id === id)));
    };
    void load();

    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (!error) {
      setRows((prev) => prev.map((row) => ({ ...row, is_read: true })));
    }
    setMarkingAll(false);
  };
  const getTargetPath = (notification: NotificationRow) => {
    if (notification.type === "message") {
      const chatId = notification.meta?.chat_id;
      return chatId ? `/${lang}/dashboard/chats?chat=${chatId}` : `/${lang}/dashboard/chats`;
    }
    const projectId = notification.meta?.project_id;
    return projectId ? `/${lang}/dashboard/projects?project=${projectId}` : `/${lang}/dashboard/projects`;
  };
  const markRead = async (notificationId: string) => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);
    setRows((prev) => prev.map((row) => (row.id === notificationId ? { ...row, is_read: true } : row)));
  };

  const markSelectedRead = async () => {
    if (!user || selectedIds.length === 0) return;
    setMarkingSelected(true);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .in("id", selectedIds);
    if (!error) {
      setRows((prev) =>
        prev.map((row) => (selectedIds.includes(row.id) ? { ...row, is_read: true } : row)),
      );
      setSelectedIds([]);
    }
    setMarkingSelected(false);
  };

  return (
    <div>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <h1 className="font-display text-xl font-bold text-foreground">{t("dashboard.notifications")}</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {rows.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markSelectedRead()}
              disabled={markingSelected || selectedIds.length === 0}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark selected read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markAllRead()}
              disabled={markingAll || rows.every((row) => row.is_read)}
            >
              {t("dashboard.mark_all_read")}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 text-sm">
          <input
            type="checkbox"
            checked={rows.length > 0 && selectedIds.length === rows.length}
            onChange={(e) => {
              if (e.target.checked) setSelectedIds(rows.map((row) => row.id));
              else setSelectedIds([]);
            }}
          />
          <span className="text-muted-foreground">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select"}
          </span>
        </div>

        <div className="divide-y divide-border">
          {rows.length === 0 && (
            <div className="py-14 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              {t("dashboard.no_notifications")}
            </div>
          )}
          {rows.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${
                item.is_read ? "bg-card" : "bg-primary/5"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedIds((prev) => [...prev, item.id]);
                  else setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                }}
                className="mt-1"
              />
              <div className="mt-0.5">
                {item.type === "message" ? (
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Link
                to={getTargetPath(item)}
                onClick={() => {
                  void markRead(item.id);
                }}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`truncate ${item.is_read ? "font-medium" : "font-semibold"} text-foreground`}>
                    {item.title}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                {item.body && <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.body}</p>}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardNotifications;
