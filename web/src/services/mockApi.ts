/**
 * mockApi.ts — Service layer giả lập backend Supabase.
 *
 * Mục tiêu Phase 9:
 *  - Tách MỌI side-effect (localStorage / network) khỏi React components.
 *  - Cung cấp API surface giống y như Supabase Edge Functions trong tương lai
 *    (auth/credits/license/checkout). Khi swap chỉ cần thay implementation.
 *  - Trả về Promise + mô phỏng latency để UI sẵn sàng skeleton/spinner.
 *
 * KHÔNG được gọi localStorage trực tiếp từ components / contexts khác — luôn qua đây.
 */

import type { UserPlan, UserState } from '../types';
import {
  addTransaction,
  listTransactions,
  seedDemoTransactions,
  type CreditTransaction,
} from './transactionStore';

const USER_KEY = 'focusproof.user.v1';
const LICENSE_KEY = 'focusproof.licenses.v1';

const DEFAULT_LATENCY_MS = 180;

function delay<T>(value: T, ms = DEFAULT_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function loadUser(): UserState | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<UserState, 'credits'> & { credits: number | 'inf' };
    return {
      ...parsed,
      credits: parsed.credits === 'inf' ? Number.POSITIVE_INFINITY : parsed.credits,
    };
  } catch {
    return null;
  }
}

function saveUser(user: UserState | null): void {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  const safe = {
    ...user,
    credits: Number.isFinite(user.credits) ? user.credits : 'inf',
  };
  localStorage.setItem(USER_KEY, JSON.stringify(safe));
}

// ───────────────────────────────────────────────────────────── Auth ──

export interface AuthSession {
  user: UserState;
  /** JWT giả — sau này thay bằng Supabase access_token. */
  token: string;
}

function fakeToken(email: string): string {
  return `mock.${btoa(email).replace(/=/g, '')}.${Date.now().toString(36)}`;
}

export const auth = {
  async getCurrent(): Promise<UserState | null> {
    return delay(loadUser(), 60);
  },

  async signup(email: string): Promise<AuthSession> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) throw new Error('Email không hợp lệ');
    const user: UserState = { plan: 'free', credits: 100, email: trimmed };
    saveUser(user);
    seedDemoTransactions(trimmed);
    return delay({ user, token: fakeToken(trimmed) });
  },

  async login(email: string): Promise<AuthSession> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) throw new Error('Email không hợp lệ');
    const existing = loadUser();
    const user: UserState = existing ?? { plan: 'free', credits: 100, email: trimmed };
    if (!existing || existing.email !== trimmed) saveUser({ ...user, email: trimmed });
    seedDemoTransactions(trimmed);
    return delay({ user: { ...user, email: trimmed }, token: fakeToken(trimmed) });
  },

  async logout(): Promise<void> {
    saveUser(null);
    return delay(undefined, 60);
  },
};

// ────────────────────────────────────────────────────────── Credits ──

export const credits = {
  async list(email: string): Promise<CreditTransaction[]> {
    return delay(listTransactions(email), 80);
  },

  /**
   * Trừ credit. Reject nếu không đủ. Auto-ghi vào transaction history.
   */
  async consume(amount: number, reason: string): Promise<UserState> {
    const user = loadUser();
    if (!user) throw new Error('Chưa đăng nhập');
    if (Number.isFinite(user.credits) && user.credits < amount) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    const next: UserState = Number.isFinite(user.credits)
      ? { ...user, credits: user.credits - amount }
      : user;
    saveUser(next);
    if (user.email && Number.isFinite(amount) && amount > 0) {
      const isTrend = reason.toLowerCase().includes('trend');
      addTransaction(user.email, isTrend ? 'ai_trend' : 'ai_single', -amount, reason);
    }
    return delay(next);
  },

  async grant(amount: number, reason: string): Promise<UserState> {
    const user = loadUser();
    if (!user) throw new Error('Chưa đăng nhập');
    if (!Number.isFinite(user.credits)) return delay(user);
    const next: UserState = { ...user, credits: user.credits + amount };
    saveUser(next);
    if (user.email) addTransaction(user.email, 'streak_bonus', amount, reason);
    return delay(next);
  },
};

// ───────────────────────────────────────────────────────── Checkout ──

export interface CheckoutResult {
  ok: true;
  plan: UserPlan;
  user: UserState;
  /** Mã giao dịch giả — Momo/Stripe sẽ trả về thật. */
  orderId: string;
}

export const checkout = {
  /**
   * Mock thanh toán Momo / Stripe — luôn trả về thành công sau ~600ms.
   * Sau khi thành công: nâng cấp plan + Credit ∞.
   */
  async purchase(plan: UserPlan): Promise<CheckoutResult> {
    if (plan === 'free') throw new Error('Không thể thanh toán gói Free');
    const user = loadUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const next: UserState = { ...user, plan, credits: Number.POSITIVE_INFINITY };
    saveUser(next);
    if (user.email) {
      addTransaction(
        user.email,
        'upgrade',
        0,
        `Nâng cấp gói ${plan.toUpperCase()} — Credit không giới hạn`,
      );
    }
    return delay({
      ok: true,
      plan,
      user: next,
      orderId: `MOMO-${Date.now().toString(36).toUpperCase()}`,
    }, 650);
  },
};

// ────────────────────────────────────────────────────────── License ──

export interface LicenseRecord {
  hash: string;
  sessionId: string;
  user: string;
  focusScore: number;
  createdAt: string;
}

function loadLicenses(): LicenseRecord[] {
  try {
    const raw = localStorage.getItem(LICENSE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LicenseRecord[];
  } catch {
    return [];
  }
}

function saveLicenses(list: LicenseRecord[]): void {
  try {
    localStorage.setItem(LICENSE_KEY, JSON.stringify(list.slice(-500)));
  } catch {
    /* noop */
  }
}

export const license = {
  /**
   * Issue 1 license/certificate cho session vừa hoàn thành.
   * Hash format: `FP-XXXX-XXXX-XXXX-XXXX` (16 hex sau prefix).
   */
  async issue(input: { user: string; focusScore: number }): Promise<LicenseRecord> {
    const rand = (n: number) =>
      Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
    const hash = `FP-${rand(4)}-${rand(4)}-${rand(4)}-${rand(4)}`;
    const rec: LicenseRecord = {
      hash,
      sessionId: hash,
      user: input.user,
      focusScore: input.focusScore,
      createdAt: new Date().toISOString(),
    };
    saveLicenses([...loadLicenses(), rec]);
    return delay(rec);
  },

  /**
   * Verify 1 hash. Trả về record nếu hợp lệ, null nếu không.
   * Demo fallback: hash bắt đầu `FP-` & ≥ 16 ký tự → coi là valid với data mặc định.
   */
  async verify(hash: string): Promise<LicenseRecord | null> {
    const trimmed = hash.trim().toUpperCase();
    if (!trimmed.startsWith('FP-') || trimmed.length < 16) {
      return delay(null, 400);
    }
    const found = loadLicenses().find((r) => r.hash.toUpperCase() === trimmed);
    if (found) return delay(found, 400);
    // Fallback demo record (giúp QR test trong slide pitch luôn “xanh”).
    return delay(
      {
        hash: trimmed,
        sessionId: trimmed,
        user: 'minh.anh@example.com',
        focusScore: 87,
        createdAt: '2026-04-15T07:30:00.000Z',
      },
      450,
    );
  },
};

export const mockApi = { auth, credits, checkout, license };
export default mockApi;
