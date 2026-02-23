import type { UserRole } from "@/types/auth";

export type NavIcon = "dashboard" | "create" | "projects" | "offers" | "subscription" | "settings";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

const employerMenu: NavItem[] = [
  { href: "/arbeitsgeber", label: "Dashboard overview", icon: "dashboard" },
  { href: "/arbeitsgeber/create-project", label: "Create Project", icon: "create" },
  { href: "/arbeitsgeber/projects", label: "My Projects", icon: "projects" },
  { href: "/arbeitsgeber/offers", label: "Offers Received", icon: "offers" },
  { href: "/arbeitsgeber/settings", label: "Settings", icon: "settings" },
];

const contractorMenu: NavItem[] = [
  { href: "/unternehmer", label: "Dashboard overview", icon: "dashboard" },
  { href: "/unternehmer/projects", label: "Browse Projects", icon: "projects" },
  { href: "/unternehmer/offers", label: "My Offers", icon: "offers" },
  { href: "/unternehmer/subscription", label: "Subscription", icon: "subscription" },
  { href: "/unternehmer/settings", label: "Settings", icon: "settings" },
];

export const getMenuByRole = (role: UserRole): NavItem[] =>
  role === "employer" ? employerMenu : contractorMenu;
