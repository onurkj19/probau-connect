import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

/** Fade-in on route change (Tailwind + tailwindcss-animate). */
export function RouteFade({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname + location.search} className="animate-in fade-in-0 duration-200">
      {children}
    </div>
  );
}
