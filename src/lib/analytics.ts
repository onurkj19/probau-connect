type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || "G-9QHRPGZ65J";
let initialized = false;

export function initAnalytics() {
  if (initialized || !MEASUREMENT_ID || typeof window === "undefined") return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function trackEvent(name: string, params?: AnalyticsParams) {
  if (!MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

export function trackPageView(path: string) {
  if (!MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    send_to: MEASUREMENT_ID,
  });
}
