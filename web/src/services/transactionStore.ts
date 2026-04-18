/**
 * Transaction store — persist credit history vào localStorage.
 *
 * Phase Supabase: thay bằng table `credit_transactions` + RLS.
 */

export type TransactionType =
  | 'initial'
  | 'ai_single'
  | 'ai_trend'
  | 'referral_bonus'
  | 'streak_bonus'
  | 'purchase'
  | 'upgrade';

export interface CreditTransaction {
  id: string;
  email: string;
  type: TransactionType;
  /** Dương = cộng, âm = trừ */
  amount: number;
  description: string;
  /** ISO date */
  createdAt: string;
}

const STORAGE_KEY = 'focusproof.transactions.v1';
const MAX_TRANSACTIONS = 200;

function readAll(): CreditTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CreditTransaction[];
  } catch {
    return [];
  }
}

function writeAll(list: CreditTransaction[]) {
  try {
    const trimmed = list.slice(-MAX_TRANSACTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota exceeded — silently drop */
  }
}

/** Lấy toàn bộ transactions của 1 email, mới nhất trước. */
export function listTransactions(email: string): CreditTransaction[] {
  return readAll()
    .filter((t) => t.email === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Push 1 transaction mới. */
export function addTransaction(
  email: string,
  type: TransactionType,
  amount: number,
  description: string,
): CreditTransaction {
  const tx: CreditTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    type,
    amount,
    description,
    createdAt: new Date().toISOString(),
  };
  writeAll([...readAll(), tx]);
  return tx;
}

/** Seed dữ liệu demo cho user mới (7 ngày qua). */
export function seedDemoTransactions(email: string): void {
  const existing = listTransactions(email);
  if (existing.length > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const all = readAll();

  const seed: Array<Omit<CreditTransaction, 'id' | 'email'>> = [
    { type: 'initial', amount: 100, description: 'Tặng khi đăng ký', createdAt: new Date(now - 7 * day).toISOString() },
    { type: 'ai_single', amount: -20, description: 'AI Analysis — phiên 35 phút Coding', createdAt: new Date(now - 6 * day).toISOString() },
    { type: 'streak_bonus', amount: 10, description: 'Streak 3 ngày liên tục 🔥', createdAt: new Date(now - 5 * day).toISOString() },
    { type: 'ai_single', amount: -20, description: 'AI Analysis — phiên Deep Work', createdAt: new Date(now - 4 * day).toISOString() },
    { type: 'ai_trend', amount: -50, description: 'AI Trend Analysis 7 ngày', createdAt: new Date(now - 3 * day).toISOString() },
    { type: 'referral_bonus', amount: 20, description: 'Bạn @minh.anh đã cài + hoàn thành session', createdAt: new Date(now - 2 * day).toISOString() },
    { type: 'streak_bonus', amount: 10, description: 'Streak 5 ngày liên tục 🔥', createdAt: new Date(now - 1 * day).toISOString() },
  ];

  const seeded: CreditTransaction[] = seed.map((s, i) => ({
    ...s,
    email,
    id: `tx_seed_${now}_${i}`,
  }));

  writeAll([...all, ...seeded]);
}

/** Tổng credit theo type — dùng cho Pie chart. */
export function summarizeByType(email: string): Array<{ type: TransactionType; total: number }> {
  const map = new Map<TransactionType, number>();
  for (const tx of listTransactions(email)) {
    map.set(tx.type, (map.get(tx.type) ?? 0) + Math.abs(tx.amount));
  }
  return Array.from(map.entries()).map(([type, total]) => ({ type, total }));
}

/** Daily series 14 ngày — dùng cho Line chart. */
export function dailySeries(email: string, days = 14): Array<{ date: string; spent: number; earned: number }> {
  const txs = listTransactions(email);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, { spent: number; earned: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { spent: 0, earned: 0 });
  }

  for (const tx of txs) {
    const key = tx.createdAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (tx.amount >= 0) bucket.earned += tx.amount;
    else bucket.spent += -tx.amount;
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
}

/** Xoá toàn bộ transactions của 1 email (vd: khi logout cứng). */
export function clearTransactions(email: string): void {
  writeAll(readAll().filter((t) => t.email !== email));
}
