import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "owner" | "contractor";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";
export type PlanType = "basic" | "pro";

export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  role: UserRole;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  planType: PlanType | null;
  offerCountThisMonth: number;
  subscriptionCurrentPeriodEnd: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  canSubmitOffer: boolean;
  offerLimitReached: boolean;
  offerLimit: number | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  role: UserRole;
}

const OFFER_LIMITS: Record<PlanType, number | null> = {
  basic: 10,
  pro: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
  });

  const login = useCallback(async (_email: string, _password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    // TODO: Replace with real auth API call (e.g. Supabase)
    await new Promise((r) => setTimeout(r, 500));
    setState({
      isLoading: false,
      user: {
        id: "demo-1",
        email: _email,
        name: "Demo User",
        companyName: "Demo AG",
        role: "owner",
        stripeCustomerId: null,
        subscriptionStatus: "none",
        planType: null,
        offerCountThisMonth: 0,
        subscriptionCurrentPeriodEnd: null,
      },
    });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((s) => ({ ...s, isLoading: true }));
    // TODO: Replace with real auth API call (e.g. Supabase)
    await new Promise((r) => setTimeout(r, 500));
    setState({
      isLoading: false,
      user: {
        id: "demo-2",
        email: data.email,
        name: data.name,
        companyName: data.companyName,
        role: data.role,
        stripeCustomerId: null,
        subscriptionStatus: "none",
        planType: null,
        offerCountThisMonth: 0,
        subscriptionCurrentPeriodEnd: null,
      },
    });
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isLoading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    // TODO: Re-fetch user data from API to get updated subscription status
    // const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    // const data = await res.json();
    // setState((s) => ({ ...s, user: data }));
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
