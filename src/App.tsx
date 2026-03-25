import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LocaleLayout, LocaleRedirect } from "@/lib/i18n-routing";
import { AuthProvider } from "@/lib/auth";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminRoleGuard } from "@/components/auth/AdminRoleGuard";
import ScrollToTop from "@/components/ScrollToTop";
import { RouteFade } from "@/components/RouteFade";
import { trackPageView } from "@/lib/analytics";
import "./i18n";

const Layout = lazy(() => import("@/components/Layout"));
const Index = lazy(() => import("./pages/Index"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Projects = lazy(() => import("./pages/Projects"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const RegisterConfirm = lazy(() => import("./pages/RegisterConfirm"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ServiceLanding = lazy(() => import("./pages/ServiceLanding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Banned = lazy(() => import("./pages/Banned"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const DashboardLayout = lazy(() => import("@/components/dashboard/DashboardLayout"));
const DashboardOverview = lazy(() => import("./pages/dashboard/Overview"));
const DashboardProjects = lazy(() => import("./pages/dashboard/Projects"));
const DashboardOffers = lazy(() => import("./pages/dashboard/Offers"));
const DashboardChats = lazy(() => import("./pages/dashboard/Chats"));
const DashboardNotifications = lazy(() => import("./pages/dashboard/Notifications"));
const DashboardSavedProjects = lazy(() => import("./pages/dashboard/SavedProjects"));
const DashboardSettings = lazy(() => import("./pages/dashboard/Settings"));
const DashboardSubscription = lazy(() => import("./pages/dashboard/Subscription"));

const AdminLayout = lazy(() => import("./pages/admin/Layout"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSubscriptions = lazy(() => import("./pages/admin/Subscriptions"));
const AdminSecurity = lazy(() => import("./pages/admin/Security"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminOffers = lazy(() => import("./pages/admin/Offers"));
const AdminConversations = lazy(() => import("./pages/admin/Conversations"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminFeatureFlags = lazy(() => import("./pages/admin/FeatureFlags"));
const AdminSystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminSubscriptionPromos = lazy(() => import("./pages/admin/SubscriptionPromos"));

const queryClient = new QueryClient();

const AnalyticsRouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsRouteTracker />
          <ScrollToTop />
          <Suspense
            fallback={
              <div className="app-canvas flex min-h-screen flex-col items-center justify-center gap-4 px-4">
                <div
                  className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                  aria-hidden
                />
                <p className="text-sm text-muted-foreground">Loading…</p>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LocaleRedirect />} />

              <Route path="/:locale" element={<LocaleLayout />}>
                {/* Public pages */}
                <Route element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="services/:category" element={<ServiceLanding />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="impressum" element={<Impressum />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="register/confirm" element={<RegisterConfirm />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="unauthorized" element={<Unauthorized />} />
                  <Route path="banned" element={<Banned />} />
                </Route>

                {/* Dashboard (protected) */}
                <Route path="dashboard" element={<RoleGuard><DashboardLayout /></RoleGuard>}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="projects" element={<DashboardProjects />} />
                  <Route path="saved" element={<DashboardSavedProjects />} />
                  <Route path="offers" element={<DashboardOffers />} />
                  <Route path="chats" element={<DashboardChats />} />
                  <Route path="notifications" element={<DashboardNotifications />} />
                  <Route path="subscription" element={<RoleGuard allowedRoles={["contractor"]}><DashboardSubscription /></RoleGuard>} />
                  <Route path="settings" element={<DashboardSettings />} />
                </Route>

                {/* Admin (protected) */}
                <Route path="admin" element={<AdminRoleGuard><AdminLayout /></AdminRoleGuard>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="projects" element={<AdminProjects />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="conversations" element={<AdminConversations />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="security" element={<AdminSecurity />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                  <Route path="feature-flags" element={<AdminFeatureFlags />} />
                  <Route path="system-settings" element={<AdminSystemSettings />} />
                  <Route path="subscription-promos" element={<AdminSubscriptionPromos />} />
                </Route>

                {/* Unknown paths under /:locale (e.g. /de/foo) — avoid empty Outlet / blank page */}
                <Route
                  path="*"
                  element={
                    <RouteFade>
                      <NotFound />
                    </RouteFade>
                  }
                />
              </Route>

              <Route
                path="*"
                element={
                  <RouteFade>
                    <NotFound />
                  </RouteFade>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
