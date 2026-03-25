import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Stable route shell: remount on navigation without tailwindcss-animate "enter"
 * (that animation can leave content invisible with reduced-motion / fill-mode edge cases).
 */
export function RouteFade({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname + location.search} className="min-h-0 opacity-100">
      {children}
    </div>
  );
}
