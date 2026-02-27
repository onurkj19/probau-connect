import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

const Layout = () => {
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message?: string }>({ enabled: false });

  useEffect(() => {
    let active = true;
    const loadMaintenance = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "maintenance_banner")
        .maybeSingle();
      if (!active) return;
      const value = (data?.value as { enabled?: boolean; message?: string } | null) ?? null;
      setMaintenance({ enabled: Boolean(value?.enabled), message: value?.message || "" });
    };

    void loadMaintenance();
    const channel = supabase
      .channel("maintenance-banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings", filter: "key=eq.maintenance_banner" }, () => {
        void loadMaintenance();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {maintenance.enabled && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black">
          {maintenance.message || "Scheduled maintenance in progress."}
        </div>
      )}
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
