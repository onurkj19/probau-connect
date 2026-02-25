import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
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
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, type, meta, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as NotificationRow[]);
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
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard.notifications")}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void markAllRead()}
          disabled={markingAll || rows.every((row) => row.is_read)}
        >
          {t("dashboard.mark_all_read")}
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {rows.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            {t("dashboard.no_notifications")}
          </div>
        )}
        {rows.map((item) => (
          <Link
            key={item.id}
            to={getTargetPath(item)}
            onClick={() => {
              void markRead(item.id);
            }}
            className={`block rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30 ${
              item.is_read ? "border-border bg-card" : "border-primary/30 bg-primary/5"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">{item.title}</p>
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>
            {item.body && <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardNotifications;
