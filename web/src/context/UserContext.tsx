import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserPlan, UserState } from '../types';
import { auth, credits as creditsApi, checkout } from '../services/mockApi';
import { seedDemoTransactions } from '../services/transactionStore';
import { pushUserState } from '../services/extensionBridge';

interface UserContextValue {
  user: UserState | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (email: string) => Promise<void>;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Trừ credit. Trả về true nếu thành công. */
  consumeCredits: (amount: number, reason?: string) => Promise<boolean>;
  /** Cộng credit. */
  addCredits: (amount: number, reason?: string) => Promise<void>;
  /** Mock thanh toán Momo → upgrade plan. */
  upgradeTo: (plan: UserPlan) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  // Boot: load current session từ mockApi (sau này = supabase.auth.getSession()).
  useEffect(() => {
    let alive = true;
    auth.getCurrent().then((u) => {
      if (!alive) return;
      setUser(u);
      if (u?.email) seedDemoTransactions(u.email);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Phase 10: đẩy mọi thay đổi user sang extension (nếu cài).
  useEffect(() => {
    pushUserState(user).catch(() => {
      /* extension chưa cài → bỏ qua */
    });
  }, [user]);

  const signup = useCallback(async (email: string) => {
    const session = await auth.signup(email);
    setUser(session.user);
  }, []);

  const login = useCallback(async (email: string) => {
    const session = await auth.login(email);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  const consumeCredits = useCallback(async (amount: number, reason?: string): Promise<boolean> => {
    try {
      const next = await creditsApi.consume(amount, reason ?? 'Sử dụng tính năng AI');
      setUser(next);
      return true;
    } catch (err) {
      if ((err as Error).message === 'INSUFFICIENT_CREDITS') return false;
      throw err;
    }
  }, []);

  const addCredits = useCallback(async (amount: number, reason?: string) => {
    const next = await creditsApi.grant(amount, reason ?? 'Thưởng Credit');
    setUser(next);
  }, []);

  const upgradeTo = useCallback(async (plan: UserPlan) => {
    if (plan === 'free') {
      setUser((prev) => (prev ? { ...prev, plan: 'free' } : prev));
      return;
    }
    const result = await checkout.purchase(plan);
    setUser(result.user);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      signup,
      login,
      logout,
      consumeCredits,
      addCredits,
      upgradeTo,
    }),
    [user, loading, signup, login, logout, consumeCredits, addCredits, upgradeTo],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
