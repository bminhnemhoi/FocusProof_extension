/**
 * Unit tests cho storage.ts — trọng tâm backup/restore (exportAllData/importAllData).
 * Dùng chrome.storage.local in-memory do test/setup.ts cung cấp.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { exportAllData, importAllData, getSessionHistory, getBadges } from '@/utils/storage';
import type { SessionData } from '@/utils/types';

/** Tạo session tối thiểu hợp lệ cho fixture. */
function makeSession(id: string, startTime: number): SessionData {
  return {
    id,
    config: {
      taskName: 'test',
      mode: 'study',
      allowedDomains: [],
      allowExternalApps: false,
      strictMode: false,
      durationMinutes: 25,
      cameraEnabled: false,
    },
    status: 'finished',
    startTime,
    samples: [],
    badges: [],
  };
}

/** Tạo chuỗi JSON file sao lưu hợp lệ với data tuỳ biến. */
function makeBackup(data: Record<string, unknown>, schemaVersion = 1): string {
  return JSON.stringify({
    schemaVersion,
    exportedAt: new Date().toISOString(),
    data,
  });
}

beforeEach(async () => {
  await chrome.storage.local.remove([
    'sessionHistory',
    'badges',
    'currentSession',
    'fp_analytics_events',
    'fp_install_id',
  ]);
});

describe('exportAllData', () => {
  it('should export sessionHistory, badges, analytics events and install id', async () => {
    await chrome.storage.local.set({
      sessionHistory: [makeSession('s1', 1000), makeSession('s2', 2000)],
      badges: { early_bird: true },
      fp_analytics_events: [{ name: 'session_started', ts: 123 }],
      fp_install_id: 'fp_test_id',
    });

    const json = await exportAllData();
    const parsed = JSON.parse(json);

    expect(parsed.schemaVersion).toBe(1);
    expect(typeof parsed.exportedAt).toBe('string');
    expect(parsed.data.sessionHistory).toHaveLength(2);
    expect(parsed.data.badges).toEqual({ early_bird: true });
    expect(parsed.data.fp_analytics_events).toHaveLength(1);
    expect(parsed.data.fp_install_id).toBe('fp_test_id');
  });

  it('should NOT include currentSession (phiên đang chạy)', async () => {
    await chrome.storage.local.set({
      currentSession: makeSession('running', 999),
      sessionHistory: [makeSession('s1', 1000)],
    });

    const parsed = JSON.parse(await exportAllData());
    expect(parsed.data).not.toHaveProperty('currentSession');
    expect(JSON.stringify(parsed)).not.toContain('"running"');
  });

  it('should export sane defaults when storage is empty', async () => {
    const parsed = JSON.parse(await exportAllData());
    expect(parsed.data.sessionHistory).toEqual([]);
    expect(parsed.data.badges).toEqual({});
    expect(parsed.data.fp_analytics_events).toEqual([]);
    expect(parsed.data.fp_install_id).toBeNull();
  });
});

describe('importAllData', () => {
  it('should import sessions and badges into empty storage', async () => {
    const json = makeBackup({
      sessionHistory: [makeSession('a', 1000), makeSession('b', 2000)],
      badges: { early_bird: true, marathon: false },
    });

    const result = await importAllData(json);

    expect(result.imported.sessions).toBe(2);
    expect(result.imported.badges).toBe(1); // chỉ badge true mới tính
    expect(result.skipped).toBe(0);
    expect(await getSessionHistory()).toHaveLength(2);
    expect(await getBadges()).toEqual({ early_bird: true, marathon: false });
  });

  it('should merge without duplicating sessions with the same id', async () => {
    await chrome.storage.local.set({
      sessionHistory: [makeSession('a', 1000), makeSession('b', 2000)],
    });

    const json = makeBackup({
      sessionHistory: [makeSession('b', 2000), makeSession('c', 3000)],
      badges: {},
    });
    const result = await importAllData(json);

    expect(result.imported.sessions).toBe(1); // chỉ 'c' là mới
    const history = await getSessionHistory();
    expect(history.map((s) => s.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('should OR badges with existing ones (không mất badge cũ)', async () => {
    await chrome.storage.local.set({ badges: { early_bird: true, marathon: false } });

    const json = makeBackup({
      sessionHistory: [],
      badges: { early_bird: false, marathon: true, focused: true },
    });
    const result = await importAllData(json);

    expect(await getBadges()).toEqual({ early_bird: true, marathon: true, focused: true });
    expect(result.imported.badges).toBe(2); // marathon + focused mới bật
  });

  it('should skip corrupted session entries and count them', async () => {
    const json = makeBackup({
      sessionHistory: [
        makeSession('ok', 1000),
        { id: '', startTime: 2000, samples: [] }, // id rỗng
        { id: 'x', startTime: 'not-a-number', samples: [] }, // startTime sai kiểu
        { id: 'y', startTime: 3000 }, // thiếu samples
        null, // không phải object
        makeSession('ok2', 4000),
      ],
      badges: {},
    });
    const result = await importAllData(json);

    expect(result.imported.sessions).toBe(2);
    expect(result.skipped).toBe(4);
    expect((await getSessionHistory()).map((s) => s.id)).toEqual(['ok', 'ok2']);
  });

  it('should ignore non-boolean badge values', async () => {
    const json = makeBackup({
      sessionHistory: [],
      badges: { valid: true, hacky: 'yes', num: 1 },
    });
    const result = await importAllData(json);

    expect(await getBadges()).toEqual({ valid: true });
    expect(result.imported.badges).toBe(1);
  });

  it('should cap merged history at 100 sessions (giữ phiên gần nhất)', async () => {
    const existing = Array.from({ length: 95 }, (_, i) => makeSession(`old${i}`, i + 1));
    await chrome.storage.local.set({ sessionHistory: existing });

    const incoming = Array.from({ length: 10 }, (_, i) => makeSession(`new${i}`, 1000 + i));
    const json = makeBackup({ sessionHistory: incoming, badges: {} });
    const result = await importAllData(json);

    expect(result.imported.sessions).toBe(10);
    const history = await getSessionHistory();
    expect(history).toHaveLength(100);
    // Phiên mới (startTime lớn) phải còn; phiên cũ nhất bị cắt
    expect(history.some((s) => s.id === 'new9')).toBe(true);
    expect(history.some((s) => s.id === 'old0')).toBe(false);
  });

  it('should be idempotent: import lại chính file vừa export → 0 mục mới', async () => {
    await chrome.storage.local.set({
      sessionHistory: [makeSession('a', 1000)],
      badges: { early_bird: true },
    });

    const json = await exportAllData();
    const result = await importAllData(json);

    expect(result.imported.sessions).toBe(0);
    expect(result.imported.badges).toBe(0);
    expect(await getSessionHistory()).toHaveLength(1);
  });

  it('should throw Vietnamese error for invalid JSON', async () => {
    await expect(importAllData('not json {')).rejects.toThrow(/không phải JSON/);
  });

  it('should throw for unsupported schemaVersion', async () => {
    const json = makeBackup({ sessionHistory: [], badges: {} }, 99);
    await expect(importAllData(json)).rejects.toThrow(/không được hỗ trợ/);
  });

  it('should throw when "data" field is missing', async () => {
    await expect(importAllData(JSON.stringify({ schemaVersion: 1 })))
      .rejects.toThrow(/thiếu trường "data"/);
  });

  it('should throw when sessionHistory is not an array', async () => {
    const json = makeBackup({ sessionHistory: 'oops', badges: {} });
    await expect(importAllData(json)).rejects.toThrow(/phải là mảng/);
  });

  it('should throw when badges is not an object', async () => {
    const json = makeBackup({ sessionHistory: [], badges: [true] });
    await expect(importAllData(json)).rejects.toThrow(/badges/);
  });

  it('should not modify storage when validation fails', async () => {
    await chrome.storage.local.set({ sessionHistory: [makeSession('keep', 1)] });
    await expect(importAllData('broken')).rejects.toThrow();
    expect((await getSessionHistory()).map((s) => s.id)).toEqual(['keep']);
  });
});
