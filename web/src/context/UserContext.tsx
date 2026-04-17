import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserPlan, UserState } from '../types';

/**
 * UserContext — quản lý state user (plan, credits, email).
 *
 * Phase 2 (HIỆN TẠI): persist trong localStorage để demo flow đầy đủ:
 *   signup → trial → consume credit → exhausted → upgrade Pro → unlimited.
 *
 * Phase tiếp theo (Supabase): thay `loadFromStorage` bằng fetch /user/profile
 * với JWT từ chrome.storage.local hoặc cookie HttpOnly.
 */

const STORAGE_KEY = 'focusproof.user.v1';

interface UserContextValue {
  user: UserState | null;
  /** true khi đã đăng nhập */
  isAuthenticated: boolean;
  /** Mock signup: tạo user free + 100 credit. */
  signup: (email: string) => void;
  /** Mock login: nếu email tồn tại trong storage → load lại, không thì signup mới. */
  login: (email: string) => void;
  logout: () => void;
  /** Trừ credit (atomic mock). Trả về true nếu thành công. */
  consumeCredits: (amount: number) => boolean;
  /** Thêm credit (referral, streak, admin...). */
  addCredits: (amount: number) => void;
  /** Mock upgrade — gọi sau khi "thanh toán Momo thành công". */
  upgradeTo: (plan: UserPlan) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function loadFromStorage(): UserState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<UserState, 'credits'> & { credits: number | 'inf' };
    // Restore Infinity (JSON không serialize được)
    return {
      ...parsed,
      credits: parsed.credits === 'inf' ? Number.POSITIVE_INFINITY : parsed.credits,
    };
  } catch {
    return null;
  }
}

function saveToStorage(user: UserState | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const safe = {
    ...user,
    credits: Number.isFinite(user.credits) ? user.credits : 'inf',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(user);
  }, [user]);

  const signup = useCallback((email: string) => {
    setUser({ plan: 'free', credits: 100, email });
  }, []);

  const login = useCallback((email: string) => {
    // Mock: nếu chưa có thì tạo mới
    setUser((prev) => prev ?? { plan: 'free', credits: 100, email });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const consumeCredits = useCallback((amount: number): boolean => {
    let ok = false;
    setUser((prev) => {
      if (!prev) return prev;
      // Pro/Team unlimited
      if (!Number.isFinite(prev.credits)) {
        ok = true;
        return prev;
      }
      if (prev.credits < amount) {
        ok = false;
        return prev;
      }
      ok = true;
      return { ...prev, credits: prev.credits - amount };
    });
    return ok;
  }, []);

  const addCredits = useCallback((amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      if (!Number.isFinite(prev.credits)) return prev;
      return { ...prev, credits: prev.credits + amount };
    });
  }, []);

  const upgradeTo = useCallback((plan: UserPlan) => {
    setUser((prev) => {
      const base = prev ?? { plan: 'free' as UserPlan, credits: 100, email: undefined };
      return {
        ...base,
        plan,
        credits: plan === 'free' ? base.credits : Number.POSITIVE_INFINITY,
      };
    });
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      signup,
      login,
      logout,
      consumeCredits,
      addCredits,
      upgradeTo,
    }),
    [user, signup, login, logout, consumeCredits, addCredits, upgradeTo],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
