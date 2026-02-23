import type { UserRole } from "@/types/auth";

export interface NavItem {
  href: string;
  label: string;
}

const employerMenu: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/employer/create-project", label: "Create project" },
  { href: "/dashboard/employer/projects", label: "My projects" },
];

const contractorMenu: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/contractor/projects", label: "Browse projects" },
  { href: "/dashboard/contractor/my-offers", label: "My offers" },
  { href: "/dashboard/contractor/subscription", label: "Subscription" },
];

export const getMenuByRole = (role: UserRole): NavItem[] =>
  role === "employer" ? employerMenu : contractorMenu;
