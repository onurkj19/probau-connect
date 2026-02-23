export type UserRole = "employer" | "contractor";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  isSubscribed: boolean;
  plan: "basic" | "pro" | null;
}

export interface AuthPayload {
  email: string;
  password: string;
  role: UserRole;
  company: string;
  name: string;
  isSubscribed?: boolean;
  plan?: "basic" | "pro";
}
