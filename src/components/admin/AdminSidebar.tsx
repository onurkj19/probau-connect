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

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-border bg-card transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-border px-5 py-4">
          <BrandLogo to={`/${lang}`} imageClassName="h-11" />
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Enterprise Control</p>
          <h1 className="mt-1 font-display text-xl font-semibold text-foreground">Admin Panel</h1>
        </div>
        <nav className="space-y-1 p-3">
          {sections.map((section) => {
            const path = section.path ? `${basePath}/${section.path}` : basePath;
            const active = section.path ? location.pathname.startsWith(path) : location.pathname === basePath;
            return (
              <Link
                key={section.key}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <BellRing className="h-3.5 w-3.5" />
            Realtime admin monitoring enabled
          </p>
        </div>
      </aside>
    </>
  );
}
