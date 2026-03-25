import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics } from "@/lib/analytics";
import { Analytics } from "@vercel/analytics/react";

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>,
);
