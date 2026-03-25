import { Link, useLocation, useParams } from "react-router-dom";
import {
  BarChart3,
  BellRing,
  ClipboardList,
  CreditCard,
  Flag,
  FolderKanban,
  Gauge,
  ScrollText,
  MessageSquare,
  Settings2,
  Shield,
  SlidersHorizontal,
  TicketPercent,
  Users,
  Menu,
  X,
} from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sections = [
  { key: "overview", label: "Overview", icon: Gauge, path: "" },
  { key: "users", label: "Users", icon: Users, path: "users" },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard, path: "subscriptions" },
  { key: "projects", label: "Projects", icon: FolderKanban, path: "projects" },
  { key: "offers", label: "Offers", icon: ClipboardList, path: "offers" },
  { key: "conversations", label: "Conversations", icon: MessageSquare, path: "conversations" },
  { key: "reports", label: "Reports", icon: Flag, path: "reports" },
  { key: "analytics", label: "Analytics", icon: BarChart3, path: "analytics" },
  { key: "security", label: "Security", icon: Shield, path: "security" },
  { key: "auditLogs", label: "Audit Logs", icon: ScrollText, path: "audit-logs" },
  { key: "featureFlags", label: "Feature Flags", icon: SlidersHorizontal, path: "feature-flags" },
  { key: "subscriptionPromos", label: "Subscription Promos", icon: TicketPercent, path: "subscription-promos" },
  { key: "systemSettings", label: "System Settings", icon: Settings2, path: "system-settings" },
];

export function AdminSidebar() {
  const location = useLocation();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const basePath = `/${lang}/admin`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className="fixed left-4 top-4 z-50 h-10 w-10 rounded-md border border-border bg-secondary md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="shrink-0 border-b border-border px-6 py-6">
          <BrandLogo to={`/${lang}`} imageClassName="h-11" />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Enterprise Control</p>
          <h1 className="mt-2 text-xl font-semibold">Admin Panel</h1>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => {
            const path = section.path ? `${basePath}/${section.path}` : basePath;
            const active = section.path ? location.pathname.startsWith(path) : location.pathname === basePath;
            return (
              <Link
                key={section.key}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-smooth hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 space-y-3 border-t border-border px-5 py-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <BellRing className="h-3.5 w-3.5" />
            Realtime admin monitoring enabled
          </p>
          {user && (
            <div className="surface-panel-tight flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                  {(user.email?.[0] ?? "A").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <p className="truncate text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
