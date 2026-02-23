import type { UserRole } from "@/types/auth";

export const getRoleHomePath = (role: UserRole): string =>
  role === "employer" ? "/arbeitsgeber" : "/unternehmer";

export const getRoleLabel = (role: UserRole): string =>
  role === "employer" ? "Arbeitsgeber" : "Unternehmer";
