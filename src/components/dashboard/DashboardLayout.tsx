import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";

const DashboardLayout = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
      <div className="container max-w-5xl pb-8 pt-4 md:py-8">
        <Outlet />
      </div>
    </main>
  </div>
);

export default DashboardLayout;
