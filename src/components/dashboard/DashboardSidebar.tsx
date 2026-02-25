import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { LayoutDashboard, FolderOpen, FileText, Settings, CreditCard, LogOut, X, Menu, Bell, Bookmark } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/${lang}/dashboard`;

  const ownerLinks = [
    { to: basePath, icon: LayoutDashboard, label: t("dashboard.overview"), exact: true },
    { to: `${basePath}/projects`, icon: FolderOpen, label: t("dashboard.my_projects") },
    { to: `${basePath}/saved`, icon: Bookmark, label: t("dashboard.saved_projects") },
    { to: `${basePath}/chats`, icon: FileText, label: t("dashboard.messages") },
    { to: `${basePath}/notifications`, icon: Bell, label: t("dashboard.notifications") },
    { to: `${basePath}/settings`, icon: Settings, label: t("dashboard.settings") },
  ];

  const contractorLinks = [
    { to: basePath, icon: LayoutDashboard, label: t("dashboard.overview"), exact: true },
    { to: `${basePath}/projects`, icon: FolderOpen, label: t("dashboard.find_projects") },
    { to: `${basePath}/saved`, icon: Bookmark, label: t("dashboard.saved_projects") },
    { to: `${basePath}/offers`, icon: FileText, label: t("dashboard.my_offers") },
    { to: `${basePath}/chats`, icon: FileText, label: t("dashboard.messages") },
    { to: `${basePath}/notifications`, icon: Bell, label: t("dashboard.notifications") },
    { to: `${basePath}/subscription`, icon: CreditCard, label: t("dashboard.subscription") },
    { to: `${basePath}/settings`, icon: Settings, label: t("dashboard.settings") },
  ];

  const links = user?.role === "contractor" ? contractorLinks : ownerLinks;
  const profileInitials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const navContent = (
    <>
      <div className="flex items-center gap-2 border-b border-border px-4 py-5">
        <Link to={`/${lang}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <span className="font-display text-sm font-bold text-accent-foreground">P</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Pro<span className="text-accent">Bau</span>.ch
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(link.to, link.exact)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <button
          onClick={() => { logout(); setMobileOpen(false); }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>

      {user && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
              <AvatarFallback>{profileInitials || "PB"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user.name || user.companyName}</p>
              {user.profileTitle && (
                <p className="truncate text-xs text-muted-foreground">{user.profileTitle}</p>
              )}
            </div>
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-5 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
