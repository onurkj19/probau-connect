import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  type: "project" | "message";
  meta: { chat_id?: string; project_id?: string } | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, type, meta, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);
      setNotifications((data ?? []) as NotificationItem[]);
    };
    void load();

    const channel = supabase
      .channel(`notif-live-${user.id}`)
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

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );
  const getTargetPath = (notification: NotificationItem) => {
    if (notification.type === "message") {
      const chatId = notification.meta?.chat_id;
      return chatId ? `/${lang}/dashboard/chats?chat=${chatId}` : `/${lang}/dashboard/chats`;
    }
    const projectId = notification.meta?.project_id;
    return projectId ? `/${lang}/dashboard/projects?project=${projectId}` : `/${lang}/dashboard/projects`;
  };
  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!user || notification.is_read) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .eq("user_id", user.id);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card p-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <Link
              to={`/${lang}/dashboard/notifications`}
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              Open all
            </Link>
          </div>
          <div className="space-y-1">
            {notifications.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">No notifications yet.</p>
            )}
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={getTargetPath(notification)}
                onClick={() => {
                  void handleNotificationClick(notification);
                  setOpen(false);
                }}
                className={`block rounded-md px-2 py-2 text-xs ${
                  notification.is_read ? "bg-muted/40" : "bg-primary/5"
                }`}
              >
                <p className="font-semibold text-foreground">{notification.title}</p>
                {notification.body && (
                  <p className="mt-0.5 text-muted-foreground">{notification.body}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
