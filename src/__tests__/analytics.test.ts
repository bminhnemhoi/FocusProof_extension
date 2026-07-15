/**
 * Unit tests cho analytics.ts (theo dõi sự kiện + bắt lỗi runtime).
 * Dùng chrome.storage.local in-memory do test/setup.ts cung cấp.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  track,
  logError,
  getSummary,
  clearAnalytics,
  getRecentErrors,
  getInstallId,
} from '@/utils/analytics';

describe('analytics', () => {
  beforeEach(async () => {
    await chrome.storage.local.remove(['fp_analytics_events', 'fp_install_id']);
  });

  it('should record a tracked event locally', async () => {
    await track('session_started', { mode: 'study' });
    const summary = await getSummary();
    expect(summary.total).toBe(1);
    expect(summary.counts['session_started']).toBe(1);
  });

  it('should aggregate multiple events by name', async () => {
    await track('session_started');
    await track('session_completed', { scoreBucket: 'A+' });
    await track('session_completed', { scoreBucket: 'B' });
    const summary = await getSummary();
    expect(summary.counts['session_completed']).toBe(2);
    expect(summary.total).toBe(3);
  });

  it('should capture runtime errors as runtime_error events', async () => {
    await logError('background', new Error('boom'));
    const summary = await getSummary();
    expect(summary.errorCount).toBe(1);
  });

  it('should sanitize error messages (truncate long messages)', async () => {
    await logError('popup', new Error('x'.repeat(1000)));
    const res = await chrome.storage.local.get('fp_analytics_events');
    const events = res['fp_analytics_events'] as Array<{ props?: Record<string, string> }>;
    const msg = events[0].props?.message ?? '';
    expect(msg.length).toBeLessThanOrEqual(300);
  });

  it('should cap the ring buffer at 200 events', async () => {
    for (let i = 0; i < 210; i++) await track('voice_note');
    const summary = await getSummary();
    expect(summary.total).toBe(200);
  });

  it('should clear analytics', async () => {
    await track('pdf_exported');
    await clearAnalytics();
    const summary = await getSummary();
    expect(summary.total).toBe(0);
  });

  it('clearAnalytics should NOT remove fp_install_id (định danh thiết bị)', async () => {
    const id = await getInstallId();
    await track('session_started');
    await clearAnalytics();
    const res = await chrome.storage.local.get('fp_install_id');
    expect(res['fp_install_id']).toBe(id);
  });
});

describe('sanitizeError – mask đường dẫn file', () => {
  beforeEach(async () => {
    await chrome.storage.local.remove(['fp_analytics_events', 'fp_install_id']);
  });

  /** Đọc message của event lỗi đầu tiên trong ring buffer. */
  async function firstErrorProps(): Promise<Record<string, string>> {
    const res = await chrome.storage.local.get('fp_analytics_events');
    const events = res['fp_analytics_events'] as Array<{ props?: Record<string, string> }>;
    return events[0].props ?? {};
  }

  it('should mask chrome-extension:// URLs in message', async () => {
    await logError(
      'popup',
      new Error('Failed to load chrome-extension://abcdefghijklmnopabcdefghijklmnop/assets/popup.js module'),
    );
    const { message } = await firstErrorProps();
    expect(message).toContain('<path>');
    expect(message).not.toContain('chrome-extension://');
    expect(message).not.toContain('popup.js');
  });

  it('should mask Windows paths in message', async () => {
    await logError('background', new Error('ENOENT: C:\\Users\\Admin\\secret\\file.txt not found'));
    const { message } = await firstErrorProps();
    expect(message).toContain('<path>');
    expect(message).not.toContain('C:\\Users');
    expect(message).not.toContain('Admin');
  });

  it('should mask Unix home paths in message', async () => {
    await logError('offscreen', new Error('cannot open /home/binhminh/project/data.json'));
    const { message } = await firstErrorProps();
    expect(message).toContain('<path>');
    expect(message).not.toContain('/home/');
    expect(message).not.toContain('binhminh');
  });

  it('should mask paths in stack traces too', async () => {
    const err = new Error('boom');
    err.stack = [
      'Error: boom',
      '    at initCamera (chrome-extension://abcdefghijklmnopabcdefghijklmnop/offscreen.js:12:5)',
      '    at C:\\Users\\Admin\\dev\\ext\\worker.js:99:1',
    ].join('\n');
    await logError('offscreen', err);
    const { stack } = await firstErrorProps();
    expect(stack).toContain('<path>');
    expect(stack).not.toContain('chrome-extension://');
    expect(stack).not.toContain('C:\\Users');
  });
});

describe('getRecentErrors', () => {
  beforeEach(async () => {
    await chrome.storage.local.remove(['fp_analytics_events', 'fp_install_id']);
  });

  it('should return empty array when no errors logged', async () => {
    await track('session_started');
    expect(await getRecentErrors()).toEqual([]);
  });

  it('should return only runtime_error events, newest first', async () => {
    await logError('background', new Error('first'));
    await track('pdf_exported'); // sự kiện thường — không được lẫn vào
    await logError('popup', new Error('second'));

    const errors = await getRecentErrors();
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toBe('second');
    expect(errors[0].context).toBe('popup');
    expect(errors[1].message).toBe('first');
    expect(errors[1].context).toBe('background');
  });

  it('should respect the limit parameter', async () => {
    for (let i = 0; i < 15; i++) await logError('popup', new Error(`e${i}`));
    const errors = await getRecentErrors(10);
    expect(errors).toHaveLength(10);
    expect(errors[0].message).toBe('e14'); // mới nhất trước
    expect(errors[9].message).toBe('e5');
  });

  it('should include stack when available and ts as number', async () => {
    await logError('offscreen', new Error('with stack'));
    const [entry] = await getRecentErrors(1);
    expect(typeof entry.ts).toBe('number');
    expect(entry.stack).toBeTruthy();
  });
});
