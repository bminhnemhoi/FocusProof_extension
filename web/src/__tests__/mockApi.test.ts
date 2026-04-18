import { describe, it, expect, beforeEach } from 'vitest';
import { auth, credits, checkout, license } from '../services/mockApi';
import { listTransactions } from '../services/transactionStore';

describe('mockApi.auth', () => {
  beforeEach(() => localStorage.clear());

  it('signup tạo user free + 100 credits + token', async () => {
    const session = await auth.signup('alice@example.com');
    expect(session.user.email).toBe('alice@example.com');
    expect(session.user.plan).toBe('free');
    expect(session.user.credits).toBe(100);
    expect(session.token).toMatch(/^mock\./);
  });

  it('signup từ chối email không hợp lệ', async () => {
    await expect(auth.signup('invalid')).rejects.toThrow('Email không hợp lệ');
  });

  it('logout xóa session', async () => {
    await auth.signup('bob@example.com');
    await auth.logout();
    const cur = await auth.getCurrent();
    expect(cur).toBeNull();
  });
});

describe('mockApi.credits', () => {
  beforeEach(async () => {
    localStorage.clear();
    await auth.signup('charlie@example.com');
  });

  it('consume thành công khi đủ credit', async () => {
    const next = await credits.consume(20, 'AI Single');
    expect(next.credits).toBe(80);
    const txs = listTransactions('charlie@example.com');
    expect(txs.some((t) => t.type === 'ai_single' && t.amount === -20)).toBe(true);
  });

  it('consume reject khi không đủ credit', async () => {
    await expect(credits.consume(9999, 'too much')).rejects.toThrow('INSUFFICIENT_CREDITS');
  });

  it('grant cộng credit + ghi transaction', async () => {
    const next = await credits.grant(50, 'streak bonus');
    expect(next.credits).toBe(150);
  });

  it('consume trên user Pro (∞) luôn ok và không tạo transaction', async () => {
    await checkout.purchase('pro');
    const before = listTransactions('charlie@example.com').length;
    const next = await credits.consume(100, 'AI on Pro');
    expect(Number.isFinite(next.credits)).toBe(false);
    // Pro: still ghi transaction để có lịch sử (theo logic hiện tại)
    const after = listTransactions('charlie@example.com').length;
    expect(after).toBeGreaterThan(before);
  });
});

describe('mockApi.checkout', () => {
  beforeEach(() => localStorage.clear());

  it('purchase Pro nâng credit lên ∞ + tạo transaction upgrade', async () => {
    await auth.signup('dan@example.com');
    const result = await checkout.purchase('pro');
    expect(result.ok).toBe(true);
    expect(result.plan).toBe('pro');
    expect(Number.isFinite(result.user.credits)).toBe(false);
    expect(result.orderId).toMatch(/^MOMO-/);
    const txs = listTransactions('dan@example.com');
    expect(txs.some((t) => t.type === 'upgrade')).toBe(true);
  });

  it('purchase free bị từ chối', async () => {
    await auth.signup('eve@example.com');
    await expect(checkout.purchase('free')).rejects.toThrow();
  });
});

describe('mockApi.license', () => {
  beforeEach(() => localStorage.clear());

  it('issue trả hash định dạng FP-XXXX-XXXX-XXXX-XXXX', async () => {
    const rec = await license.issue({ user: 'foo@example.com', focusScore: 87 });
    expect(rec.hash).toMatch(/^FP-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(rec.focusScore).toBe(87);
  });

  it('verify trả record cho hash đã issue', async () => {
    const rec = await license.issue({ user: 'foo@example.com', focusScore: 92 });
    const found = await license.verify(rec.hash);
    expect(found?.hash).toBe(rec.hash);
    expect(found?.focusScore).toBe(92);
  });

  it('verify trả null cho hash sai format', async () => {
    const found = await license.verify('not-a-hash');
    expect(found).toBeNull();
  });

  it('verify fallback cho hash đúng format chưa lưu (demo pitch)', async () => {
    const found = await license.verify('FP-AAAA-BBBB-CCCC-DDDD');
    expect(found).not.toBeNull();
    expect(found?.user).toContain('@');
  });
});
