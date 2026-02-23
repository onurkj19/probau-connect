import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { AuthProvider } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardOverview from "./pages/dashboard/Overview";
import DashboardProjects from "./pages/dashboard/Projects";
import DashboardOffers from "./pages/dashboard/Offers";
import DashboardSettings from "./pages/dashboard/Settings";
import DashboardSubscription from "./pages/dashboard/Subscription";
import { RoleGuard } from "@/components/auth/RoleGuard";
import Unauthorized from "./pages/Unauthorized";
import "./i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              </Route>

              {/* Dashboard (protected) */}
              <Route path="dashboard" element={<RoleGuard><DashboardLayout /></RoleGuard>}>
                <Route index element={<DashboardOverview />} />
                <Route path="projects" element={<DashboardProjects />} />
                <Route path="offers" element={<RoleGuard allowedRoles={["contractor"]}><DashboardOffers /></RoleGuard>} />
                <Route path="subscription" element={<RoleGuard allowedRoles={["contractor"]}><DashboardSubscription /></RoleGuard>} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
