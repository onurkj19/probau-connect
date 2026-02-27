import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "moderator" | "project_owner" | "contractor";
export type AdminRole = "super_admin" | "admin" | "moderator";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";
export type PlanType = "basic" | "pro";

export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  profileTitle: string;
  avatarUrl: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  trustScore: number;
  lastLoginAt: string | null;
  deletedAt: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  planType: PlanType | null;
  offerCountThisMonth: number;
  subscriptionCurrentPeriodEnd: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
  canSubmitOffer: boolean;
  offerLimitReached: boolean;
  offerLimit: number | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  profileTitle?: string;
  avatarUrl?: string;
  role: "project_owner" | "contractor";
}

const OFFER_LIMITS: Record<PlanType, number | null> = {
  basic: 10,
  pro: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getJwtIssuedAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const parsed = JSON.parse(atob(payload));
    return typeof parsed.iat === "number" ? parsed.iat : null;
  } catch {
    return null;
  }
}

export function isAdminRole(role: UserRole | null | undefined): role is AdminRole {
  return role === "super_admin" || role === "admin" || role === "moderator";
}

export function isProjectOwnerRole(role: UserRole | null | undefined): boolean {
  return role === "project_owner";
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const normalizedRole = data.role === "owner" ? "project_owner" : data.role;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    companyName: data.company_name,
    profileTitle: data.profile_title ?? "",
    avatarUrl: data.avatar_url ?? "",
    role: normalizedRole as UserRole,
    isVerified: Boolean(data.is_verified),
    isBanned: Boolean(data.is_banned),
    trustScore: Number(data.trust_score ?? 0),
    lastLoginAt: data.last_login_at ?? null,
    deletedAt: data.deleted_at ?? null,
    stripeCustomerId: data.stripe_customer_id,
    subscriptionStatus: data.subscription_status as SubscriptionStatus,
    planType: data.plan_type as PlanType | null,
    offerCountThisMonth: data.offer_count_this_month,
    subscriptionCurrentPeriodEnd: data.subscription_current_period_end,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  const loadUser = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({ user: null, session: null, isLoading: false });
      return;
    }

    const { data: forceLogout } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "session_force_logout_at")
      .maybeSingle();
    const forceLogoutAt = (forceLogout?.value as { timestamp?: string } | null)?.timestamp;
    if (forceLogoutAt) {
      const issuedAt = getJwtIssuedAt(session.access_token);
      const invalidAfter = Math.floor(new Date(forceLogoutAt).getTime() / 1000);
      if (issuedAt !== null && issuedAt < invalidAfter) {
        await supabase.auth.signOut();
        setState({ user: null, session: null, isLoading: false });
        return;
      }
    }

    const profile = await fetchProfile(session.user.id);
    setState({ user: profile, session, isLoading: false });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user?.id) {
          void supabase
            .from("profiles")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", session.user.id);
        }
        loadUser(session);
      },
    );

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((s) => ({ ...s, isLoading: true }));
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          company_name: data.companyName,
          profile_title: data.profileTitle ?? "",
          avatar_url: data.avatarUrl ?? "",
          role: data.role,
        },
      },
    });
    if (error) {
      setState((s) => ({ ...s, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, isLoading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setState((s) => ({ ...s, user: profile, session }));
    }
  }, []);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const user = state.user;
  const isBanned = Boolean(user?.isBanned);
  const isContractor = user?.role === "contractor";
  const hasActiveSubscription = user?.subscriptionStatus === "active";
  const canSubmitOffer = isContractor && hasActiveSubscription && !isBanned;

  const offerLimit = user?.planType ? OFFER_LIMITS[user.planType] : null;
  const offerLimitReached =
    canSubmitOffer && offerLimit !== null && Boolean(user) && user.offerCountThisMonth >= offerLimit;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
        getToken,
        canSubmitOffer: canSubmitOffer && !offerLimitReached,
        offerLimitReached,
        offerLimit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
