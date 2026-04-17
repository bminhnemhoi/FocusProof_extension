/**
 * Unit tests cho session-manager.ts
 * Test session lifecycle: start → sampling → stop → finalize → recovery.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// -------------------------------------------------------
// Mocks – setup BEFORE importing the SUT
// -------------------------------------------------------

// chrome.tabs.sendMessage for content script communication
const sendMessageMock = vi.fn().mockResolvedValue({ success: true, alive: true });
const queryMock = vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]);

Object.defineProperty(globalThis, 'chrome', {
  value: {
    tabs: {
      sendMessage: sendMessageMock,
      query: queryMock,
      get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
      onActivated: { addListener: vi.fn() },
      onUpdated: { addListener: vi.fn() },
    },
    windows: {
      WINDOW_ID_NONE: -1,
      onFocusChanged: { addListener: vi.fn() },
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    },
    runtime: {
      sendMessage: vi.fn(),
      getManifest: vi.fn().mockReturnValue({
        content_scripts: [{ matches: ['<all_urls>'], js: ['src/content-script/index.ts'], run_at: 'document_idle' }],
      }),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    scripting: {
      executeScript: vi.fn().mockResolvedValue([]),
    },
  },
  writable: true,
});

// Mock crypto.subtle for SHA-256 hash
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
  writable: true,
});

// vi.mock calls must be hoisted – mock all external dependencies
vi.mock('@/utils/storage', () => ({
  storage: {
    saveCurrentSession: vi.fn().mockResolvedValue(undefined),
    clearCurrentSession: vi.fn().mockResolvedValue(undefined),
    getCurrentSession: vi.fn().mockResolvedValue(null),
    addToHistory: vi.fn().mockResolvedValue(undefined),
    getBadges: vi.fn().mockResolvedValue([]),
    updateBadges: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/utils/focus', () => ({
  calculateSampleScore: vi.fn().mockReturnValue(85),
  calculateFinalScore: vi.fn().mockReturnValue(78),
}));

vi.mock('@/utils/gamification', () => ({
  checkBadges: vi.fn().mockReturnValue([]),
  mergeBadges: vi.fn().mockReturnValue([]),
}));

vi.mock('@/background/offscreen-manager', () => ({
  ensureDocument: vi.fn().mockResolvedValue(true),
  initCamera: vi.fn().mockResolvedValue(undefined),
  pollFace: vi.fn().mockResolvedValue({ detected: true, confidence: 0.9 }),
  destroyDocument: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/background/alert-manager', () => ({
  init: vi.fn(),
  reset: vi.fn(),
  processAlerts: vi.fn().mockReturnValue([]),
  sendToContentScript: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/background/goal-manager', () => ({
  buildGoalConfig: vi.fn().mockReturnValue({ type: 'allow', domains: ['docs.google.com'] }),
  buildTabResult: vi.fn().mockReturnValue({ isAllowed: true, isOutsideChrome: false, url: 'https://example.com', domain: 'example.com' }),
}));

// NOTE: We do NOT mock tab-tracker – it operates on our mocked chrome APIs

// -------------------------------------------------------
// SUT import (after all mocks)
// -------------------------------------------------------
import {
  getSession,
  isRunning,
  startSession,
  stopSession,
  restoreSession,
} from '@/background/session-manager';

import { storage } from '@/utils/storage';
import { calculateFinalScore, calculateSampleScore } from '@/utils/focus';
import { checkBadges, mergeBadges } from '@/utils/gamification';
import * as offscreen from '@/background/offscreen-manager';
import * as alertManager from '@/background/alert-manager';

// -------------------------------------------------------
// Helper to build a minimal SessionConfig
// -------------------------------------------------------

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    taskName: 'Viết báo cáo',
    mode: 'study' as const,
    durationMinutes: 25,
    cameraEnabled: false,
    strictMode: false,
    allowedDomains: ['docs.google.com'],
    allowExternalApps: false,
    ...overrides,
  };
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('session-manager', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset default mock to support PING (alive) + general calls
    sendMessageMock.mockResolvedValue({ success: true, alive: true });

    // Ensure no session leftover
    const session = getSession();
    if (session && session.status === 'running') {
      await stopSession();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- getSession / isRunning ----

  describe('getSession / isRunning', () => {
    it('should return null when no session', () => {
      expect(getSession()).toBeNull();
      expect(isRunning()).toBe(false);
    });
  });

  // ---- startSession ----

  describe('startSession', () => {
    it('should create a new session and return success', async () => {
      const config = makeConfig();
      const result = await startSession(config);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('sessionId');
      expect(isRunning()).toBe(true);

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session!.config.taskName).toBe('Viết báo cáo');
      expect(session!.status).toBe('running');
      expect(session!.samples).toEqual([]);
    });

    it('should persist session to storage', async () => {
      await startSession(makeConfig());
      expect(storage.saveCurrentSession).toHaveBeenCalled();
    });

    it('should init alert manager', async () => {
      await startSession(makeConfig());
      expect(alertManager.init).toHaveBeenCalled();
    });

    it('should NOT create offscreen when camera disabled', async () => {
      await startSession(makeConfig({ cameraEnabled: false }));
      expect(offscreen.ensureDocument).not.toHaveBeenCalled();
    });

    it('should create offscreen when camera enabled', async () => {
      await startSession(makeConfig({ cameraEnabled: true }));
      expect(offscreen.ensureDocument).toHaveBeenCalled();
      expect(offscreen.initCamera).toHaveBeenCalled();
    });

    it('should prevent double start', async () => {
      await startSession(makeConfig());
      const result = await startSession(makeConfig());

      expect(result).toHaveProperty('error', 'Session already running');
    });

    it('should start sampling loop (first sample immediately)', async () => {
      // Make pollActivity return known data
      sendMessageMock.mockResolvedValue({
        keystrokes: 5,
        clicks: 2,
        scrolls: 1,
        idle: false,
      });

      await startSession(makeConfig());

      // Wait for the immediate doSample to resolve
      await vi.advanceTimersByTimeAsync(100);

      const session = getSession();
      expect(session!.samples.length).toBeGreaterThanOrEqual(1);
      expect(calculateSampleScore).toHaveBeenCalled();
    });

    it('should send START_SESSION to content script', async () => {
      await startSession(makeConfig());

      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ type: 'START_SESSION' }),
      );
    });
  });

  // ---- doSample (tested indirectly through timer) ----

  describe('sampling loop', () => {
    it('should continue sampling every SAMPLING_INTERVAL_MS', async () => {
      sendMessageMock.mockResolvedValue({
        keystrokes: 1,
        clicks: 0,
        scrolls: 0,
        idle: false,
      });

      await startSession(makeConfig());

      // Wait for first sample
      await vi.advanceTimersByTimeAsync(100);
      const countAfterFirst = getSession()!.samples.length;

      // Advance by 6 seconds (SAMPLING_INTERVAL_MS)
      await vi.advanceTimersByTimeAsync(6000);
      expect(getSession()!.samples.length).toBeGreaterThan(countAfterFirst);
    });

    it('should survive doSample errors (graceful degradation)', async () => {
      // Make pollActivity throw
      sendMessageMock.mockRejectedValueOnce(new Error('tab gone'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);

      // Session should still be running
      expect(isRunning()).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  // ---- stopSession ----

  describe('stopSession', () => {
    it('should return error if no session', async () => {
      const result = await stopSession();
      expect(result).toHaveProperty('error');
    });

    it('should finalize session and return result', async () => {
      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);

      const result = await stopSession();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('session');
      expect((result as Record<string, unknown>).session).toHaveProperty('status', 'finished');
      expect((result as Record<string, unknown>).session).toHaveProperty('endTime');
      expect((result as Record<string, unknown>).session).toHaveProperty('finalScore');
      expect((result as Record<string, unknown>).session).toHaveProperty('hash');
    });

    it('should calculate final score', async () => {
      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);
      await stopSession();

      expect(calculateFinalScore).toHaveBeenCalled();
    });

    it('should check and merge badges', async () => {
      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);
      await stopSession();

      expect(checkBadges).toHaveBeenCalled();
      expect(storage.getBadges).toHaveBeenCalled();
      expect(mergeBadges).toHaveBeenCalled();
      expect(storage.updateBadges).toHaveBeenCalled();
    });

    it('should save session to history', async () => {
      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);
      await stopSession();

      expect(storage.addToHistory).toHaveBeenCalled();
    });

    it('should cleanup: clear storage, reset tab/alert, destroy offscreen', async () => {
      await startSession(makeConfig({ cameraEnabled: true }));
      await vi.advanceTimersByTimeAsync(100);
      await stopSession();

      expect(storage.clearCurrentSession).toHaveBeenCalled();
      expect(alertManager.reset).toHaveBeenCalled();
      expect(offscreen.destroyDocument).toHaveBeenCalled();
    });

    it('should send STOP_SESSION to content script', async () => {
      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);

      sendMessageMock.mockClear();
      await stopSession();

      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ type: 'STOP_SESSION' }),
      );
    });

    it('should set isRunning to false after stop', async () => {
      await startSession(makeConfig());
      await vi.advanceTimersByTimeAsync(100);
      await stopSession();

      expect(isRunning()).toBe(false);
      expect(getSession()).toBeNull();
    });
  });

  // ---- restoreSession ----

  describe('restoreSession', () => {
    it('should do nothing if no saved session', async () => {
      (storage.getCurrentSession as Mock).mockResolvedValue(null);
      await restoreSession();

      expect(isRunning()).toBe(false);
    });

    it('should restore a running session from storage', async () => {
      (storage.getCurrentSession as Mock).mockResolvedValue({
        id: 'fp_restored_abc',
        config: makeConfig(),
        status: 'running',
        startTime: Date.now() - 60000,
        samples: [],
        badges: [],
      });

      await restoreSession();

      expect(isRunning()).toBe(true);
      expect(getSession()!.id).toBe('fp_restored_abc');
      expect(alertManager.init).toHaveBeenCalled();
    });

    it('should resume sampling after restore', async () => {
      sendMessageMock.mockResolvedValue({
        keystrokes: 0,
        clicks: 0,
        scrolls: 0,
        idle: true,
      });

      (storage.getCurrentSession as Mock).mockResolvedValue({
        id: 'fp_restored_xyz',
        config: makeConfig(),
        status: 'running',
        startTime: Date.now() - 30000,
        samples: [],
        badges: [],
      });

      await restoreSession();

      // After restore, immediate sample should fire
      await vi.advanceTimersByTimeAsync(100);
      expect(getSession()!.samples.length).toBeGreaterThanOrEqual(1);
    });

    it('should re-create offscreen if camera was enabled', async () => {
      (storage.getCurrentSession as Mock).mockResolvedValue({
        id: 'fp_cam_restore',
        config: makeConfig({ cameraEnabled: true }),
        status: 'running',
        startTime: Date.now() - 10000,
        samples: [],
        badges: [],
      });

      await restoreSession();

      expect(offscreen.ensureDocument).toHaveBeenCalled();
      expect(offscreen.initCamera).toHaveBeenCalled();
    });

    it('should NOT restore a finished session', async () => {
      (storage.getCurrentSession as Mock).mockResolvedValue({
        id: 'fp_finished',
        config: makeConfig(),
        status: 'finished',
        startTime: Date.now() - 300000,
        endTime: Date.now() - 200000,
        samples: [],
        badges: [],
      });

      await restoreSession();
      expect(isRunning()).toBe(false);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('should auto-stop when duration reached', async () => {
      // Use very short duration so timeRemaining reaches 0
      const config = makeConfig({ durationMinutes: 25 });
      sendMessageMock.mockResolvedValue({
        keystrokes: 1,
        clicks: 0,
        scrolls: 0,
        idle: false,
      });

      await startSession(config);

      // Advance by 25 minutes + a bit to trigger auto-stop
      await vi.advanceTimersByTimeAsync(25 * 60 * 1000 + 6100);

      // Session should have auto-stopped
      expect(isRunning()).toBe(false);
    });

    it('should handle sendMessage failure gracefully during session', async () => {
      sendMessageMock.mockRejectedValue(new Error('No receiver'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // startSession should succeed despite content script unavailability
      const result = await startSession(makeConfig());
      expect(result).toHaveProperty('success', true);

      consoleSpy.mockRestore();
    });
  });
});
