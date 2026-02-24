import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "owner" | "contractor";
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
  role: UserRole;
}

const OFFER_LIMITS: Record<PlanType, number | null> = {
  basic: 10,
  pro: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    companyName: data.company_name,
    profileTitle: data.profile_title ?? "",
    avatarUrl: data.avatar_url ?? "",
    role: data.role as UserRole,
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

    const profile = await fetchProfile(session.user.id);
    setState({ user: profile, session, isLoading: false });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
  const isContractor = user?.role === "contractor";
  const hasActiveSubscription = user?.subscriptionStatus === "active";
  const canSubmitOffer = isContractor && hasActiveSubscription;

  const offerLimit = user?.planType ? OFFER_LIMITS[user.planType] : null;
  const offerLimitReached =
    canSubmitOffer && offerLimit !== null && user.offerCountThisMonth >= offerLimit;

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
