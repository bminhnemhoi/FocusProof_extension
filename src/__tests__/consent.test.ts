/**
 * Unit tests cho logic consent (ConsentScreen.tsx).
 * Kiểm tra hàm thuần parseConsent/buildConsent + đọc/ghi chrome.storage.local
 * (mock in-memory từ test/setup.ts).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CONSENT_STORAGE_KEY,
  parseConsent,
  buildConsent,
  readConsent,
  saveConsent,
} from '@/utils/consent';

describe('consent – buildConsent (hàm thuần)', () => {
  it('luôn tạo bản ghi với given = true', () => {
    const record = buildConsent(false, false, 1000);
    expect(record.given).toBe(true);
    expect(record.ts).toBe(1000);
  });

  it('mặc định cả 2 opt-in tắt', () => {
    const record = buildConsent(false, false, 1000);
    expect(record.aiCloudOptIn).toBe(false);
    expect(record.captureTyped).toBe(false);
  });

  it('cho phép bật cả AI cloud lẫn captureTyped', () => {
    const record = buildConsent(true, true, 1000);
    expect(record.aiCloudOptIn).toBe(true);
    expect(record.captureTyped).toBe(true);
  });

  it('ép captureTyped = false khi AI cloud tắt (ràng buộc phụ thuộc)', () => {
    const record = buildConsent(false, true, 1000);
    expect(record.aiCloudOptIn).toBe(false);
    expect(record.captureTyped).toBe(false);
  });

  it('dùng Date.now() khi không truyền ts', () => {
    const before = Date.now();
    const record = buildConsent(true, false);
    expect(record.ts).toBeGreaterThanOrEqual(before);
    expect(record.ts).toBeLessThanOrEqual(Date.now());
  });
});

describe('consent – parseConsent (hàm thuần)', () => {
  it('trả null với giá trị rỗng hoặc không phải object', () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent('yes')).toBeNull();
    expect(parseConsent(42)).toBeNull();
    expect(parseConsent(true)).toBeNull();
  });

  it('trả null khi given không phải true', () => {
    expect(parseConsent({ given: false, aiCloudOptIn: true })).toBeNull();
    expect(parseConsent({ aiCloudOptIn: true })).toBeNull();
    expect(parseConsent({ given: 'true' })).toBeNull();
  });

  it('parse đúng bản ghi hợp lệ', () => {
    const parsed = parseConsent({
      given: true,
      aiCloudOptIn: true,
      captureTyped: true,
      ts: 12345,
    });
    expect(parsed).toEqual({
      given: true,
      aiCloudOptIn: true,
      captureTyped: true,
      ts: 12345,
    });
  });

  it('ép captureTyped = false nếu aiCloudOptIn tắt (dữ liệu bị sửa tay)', () => {
    const parsed = parseConsent({
      given: true,
      aiCloudOptIn: false,
      captureTyped: true,
      ts: 1,
    });
    expect(parsed?.captureTyped).toBe(false);
  });

  it('chuẩn hóa field thiếu/sai kiểu về giá trị an toàn', () => {
    const parsed = parseConsent({ given: true });
    expect(parsed).toEqual({
      given: true,
      aiCloudOptIn: false,
      captureTyped: false,
      ts: 0,
    });
  });

  it('ts sai kiểu → 0', () => {
    const parsed = parseConsent({ given: true, ts: 'hôm qua' });
    expect(parsed?.ts).toBe(0);
  });
});

describe('consent – readConsent/saveConsent (chrome.storage.local)', () => {
  beforeEach(async () => {
    await chrome.storage.local.remove(CONSENT_STORAGE_KEY);
  });

  it('readConsent trả null khi chưa từng đồng ý', async () => {
    expect(await readConsent()).toBeNull();
  });

  it('roundtrip: save rồi read trả đúng bản ghi', async () => {
    const record = buildConsent(true, true, 99999);
    await saveConsent(record);
    const loaded = await readConsent();
    expect(loaded).toEqual(record);
  });

  it('lưu đúng key fp_consent trong storage', async () => {
    await saveConsent(buildConsent(false, false, 7));
    const raw = await chrome.storage.local.get(CONSENT_STORAGE_KEY);
    expect(raw[CONSENT_STORAGE_KEY]).toEqual({
      given: true,
      aiCloudOptIn: false,
      captureTyped: false,
      ts: 7,
    });
  });

  it('readConsent trả null nếu storage chứa dữ liệu hỏng', async () => {
    await chrome.storage.local.set({ [CONSENT_STORAGE_KEY]: 'corrupted' });
    expect(await readConsent()).toBeNull();
  });
});
