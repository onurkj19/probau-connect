export const THEME_STORAGE_KEY = "projektmarkt_theme";

export const THEME_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "dark", label: "Dark" },
  { id: "ocean", label: "Ocean" },
  { id: "emerald", label: "Emerald" },
  { id: "sunset", label: "Sunset" },
  { id: "violet", label: "Violet" },
  { id: "rose", label: "Rose" },
  { id: "amber", label: "Amber" },
  { id: "graphite", label: "Graphite" },
  { id: "forest", label: "Forest" },
  { id: "sky", label: "Sky" },
] as const;

export type ThemeId = (typeof THEME_OPTIONS)[number]["id"];

const THEME_ID_SET = new Set<string>(THEME_OPTIONS.map((theme) => theme.id));

export function isThemeId(value: string): value is ThemeId {
  return THEME_ID_SET.has(value);
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "default";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY) ?? "";
  return isThemeId(raw) ? raw : "default";
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.removeAttribute("data-theme");
    return;
  }

  root.classList.remove("dark");
  root.setAttribute("data-theme", theme);
}

export function setTheme(theme: ThemeId) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
