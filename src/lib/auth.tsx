import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "owner" | "contractor";

export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  role: UserRole;
  subscriptionActive: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  canSubmitOffer: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  companyName: string;
  role: UserRole;
}

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
        subscriptionActive: false,
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
        subscriptionActive: false,
      },
    });
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isLoading: false });
  }, []);

  const canSubmitOffer =
    state.user?.role === "contractor" && state.user.subscriptionActive;

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, canSubmitOffer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
