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
        variant="secondary"
        size="icon"
        className="fixed left-4 top-4 z-50 h-10 w-10 rounded-xl border border-white/15 bg-slate-950/90 text-slate-100 shadow-lg backdrop-blur md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950 text-slate-200 transition-transform duration-300 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <BrandLogo to={`/${lang}`} imageClassName="h-11" />
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Enterprise Control</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white">Admin Panel</h1>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {sections.map((section) => {
            const path = section.path ? `${basePath}/${section.path}` : basePath;
            const active = section.path ? location.pathname.startsWith(path) : location.pathname === basePath;
            return (
              <Link
                key={section.key}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-0",
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <section.icon className={cn("h-4 w-4 transition-transform duration-200", !active && "group-hover:scale-110")} />
                {section.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <BellRing className="h-3.5 w-3.5 text-emerald-400" />
            Realtime admin monitoring enabled
          </p>
        </div>
      </aside>
    </>
  );
}
