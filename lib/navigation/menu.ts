import type { UserRole } from "@/types/auth";

export type NavIcon = "dashboard" | "create" | "projects" | "offers" | "subscription" | "settings";

export interface NavItem {
  href: string;
  labelKey:
    | "overview"
    | "createProject"
    | "myProjects"
    | "offersReceived"
    | "browseProjects"
    | "myOffers"
    | "subscription"
    | "settings";
  icon: NavIcon;
}

const employerMenu: NavItem[] = [
  { href: "/arbeitsgeber", labelKey: "overview", icon: "dashboard" },
  { href: "/arbeitsgeber/create-project", labelKey: "createProject", icon: "create" },
  { href: "/arbeitsgeber/projects", labelKey: "myProjects", icon: "projects" },
  { href: "/arbeitsgeber/offers", labelKey: "offersReceived", icon: "offers" },
  { href: "/arbeitsgeber/settings", labelKey: "settings", icon: "settings" },
];

const contractorMenu: NavItem[] = [
  { href: "/unternehmer", labelKey: "overview", icon: "dashboard" },
  { href: "/unternehmer/projects", labelKey: "browseProjects", icon: "projects" },
  { href: "/unternehmer/offers", labelKey: "myOffers", icon: "offers" },
  { href: "/unternehmer/subscription", labelKey: "subscription", icon: "subscription" },
  { href: "/unternehmer/settings", labelKey: "settings", icon: "settings" },
];

export const getMenuByRole = (role: UserRole): NavItem[] =>
  role === "employer" ? employerMenu : contractorMenu;
