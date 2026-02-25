import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { NotificationBell } from "./NotificationBell";

const DashboardLayout = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
      <div className="container max-w-5xl pb-8 pt-4 md:py-8">
        <div className="mb-4 flex justify-end">
          <NotificationBell />
        </div>
        <Outlet />
      </div>
    </main>
  </div>
);

export default DashboardLayout;
