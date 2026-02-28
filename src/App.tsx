import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { LocaleLayout, LocaleRedirect } from "@/lib/i18n-routing";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Projects from "./pages/Projects";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Banned from "./pages/Banned";
import { AuthProvider } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
const DashboardOverview = lazy(() => import("./pages/dashboard/Overview"));
const DashboardProjects = lazy(() => import("./pages/dashboard/Projects"));
const DashboardOffers = lazy(() => import("./pages/dashboard/Offers"));
const DashboardChats = lazy(() => import("./pages/dashboard/Chats"));
const DashboardNotifications = lazy(() => import("./pages/dashboard/Notifications"));
const DashboardSavedProjects = lazy(() => import("./pages/dashboard/SavedProjects"));
const DashboardSettings = lazy(() => import("./pages/dashboard/Settings"));
const DashboardSubscription = lazy(() => import("./pages/dashboard/Subscription"));
import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminRoleGuard } from "@/components/auth/AdminRoleGuard";
import Unauthorized from "./pages/Unauthorized";
import ScrollToTop from "@/components/ScrollToTop";
import { trackPageView } from "@/lib/analytics";
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
import "./i18n";

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
              <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                <Route path="projects" element={<Projects />} />
                <Route path="impressum" element={<Impressum />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
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
            </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
