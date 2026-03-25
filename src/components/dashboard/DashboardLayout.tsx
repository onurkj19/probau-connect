import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, LogOut, Settings } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { NotificationBell } from "./NotificationBell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n-routing";

const DashboardLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locale } = useParams<{ locale: string }>();
  const lang = locale && isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const { user, logout } = useAuth();
  const basePath = `/${lang}/dashboard`;

  const profileInitials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`${basePath}/projects`);
  };

  return (
    <div className="app-canvas flex min-h-screen">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pt-12 md:pt-0">
        <header className="surface-glass-chrome sticky top-0 z-20 px-4 py-3 md:px-6">
          <div className="container flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="min-w-0 flex-1 md:max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder={t("nav.search_placeholder", { defaultValue: "Search projects…" })}
                  aria-label={t("nav.search_placeholder", { defaultValue: "Search projects…" })}
                />
              </div>
            </form>
            <div className="flex items-center gap-2">
              <NotificationBell />
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 gap-2 rounded-full px-2">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                        <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                          {profileInitials || user.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link to={basePath}>{t("dashboard.overview")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`${basePath}/settings`} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        {t("dashboard.settings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        void logout();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>
        <main className="app-main flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
