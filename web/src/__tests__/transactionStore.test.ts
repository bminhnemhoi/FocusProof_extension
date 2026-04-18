import { describe, it, expect, beforeEach } from 'vitest';
import {
  addTransaction,
  listTransactions,
  seedDemoTransactions,
  summarizeByType,
  dailySeries,
  clearTransactions,
} from '../services/transactionStore';

describe('transactionStore', () => {
  beforeEach(() => localStorage.clear());

  it('addTransaction + listTransactions trả đúng theo email, sort mới nhất trước', async () => {
    addTransaction('a@x.com', 'ai_single', -20, 'first');
    await new Promise((r) => setTimeout(r, 5));
    addTransaction('a@x.com', 'streak_bonus', 10, 'second');
    addTransaction('b@x.com', 'ai_single', -20, 'other user');
    const list = listTransactions('a@x.com');
    expect(list).toHaveLength(2);
    expect(list[0].description).toBe('second');
    expect(list[1].description).toBe('first');
  });

  it('seedDemoTransactions chỉ chạy 1 lần cho mỗi user', () => {
    seedDemoTransactions('seed@x.com');
    const first = listTransactions('seed@x.com').length;
    expect(first).toBeGreaterThan(0);
    seedDemoTransactions('seed@x.com');
    expect(listTransactions('seed@x.com')).toHaveLength(first);
  });

  it('summarizeByType gom đúng theo type', () => {
    addTransaction('s@x.com', 'ai_single', -20, 'a');
    addTransaction('s@x.com', 'ai_single', -20, 'b');
    addTransaction('s@x.com', 'streak_bonus', 10, 'c');
    const summary = summarizeByType('s@x.com');
    const ai = summary.find((s) => s.type === 'ai_single');
    expect(ai?.total).toBe(40);
    const bonus = summary.find((s) => s.type === 'streak_bonus');
    expect(bonus?.total).toBe(10);
  });

  it('dailySeries trả đúng số ngày', () => {
    addTransaction('d@x.com', 'streak_bonus', 10, 'today');
    const series = dailySeries('d@x.com', 14);
    expect(series).toHaveLength(14);
    const last = series[series.length - 1];
    expect(last.earned).toBeGreaterThanOrEqual(10);
  });

  it('clearTransactions xóa đúng user', () => {
    addTransaction('p@x.com', 'ai_single', -20, 'p');
    addTransaction('q@x.com', 'ai_single', -20, 'q');
    clearTransactions('p@x.com');
    expect(listTransactions('p@x.com')).toHaveLength(0);
    expect(listTransactions('q@x.com')).toHaveLength(1);
  });
});
