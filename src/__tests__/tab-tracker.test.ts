/**
 * Unit tests cho tab-tracker.ts
 * Test tab state management, Chrome event handling, Strict Mode support.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.tabs and chrome.windows
const mockTabs = {
  query: vi.fn(),
  get: vi.fn(),
};

const WINDOW_ID_NONE = -1;

Object.defineProperty(globalThis, 'chrome', {
  value: {
    ...((globalThis as unknown as Record<string, unknown>).chrome ?? {}),
    tabs: {
      query: mockTabs.query,
      get: mockTabs.get,
      onActivated: { addListener: vi.fn() },
      onUpdated: { addListener: vi.fn() },
    },
    windows: {
      WINDOW_ID_NONE,
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
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  },
  writable: true,
});

// Import after mock setup
import {
  getState,
  refreshCurrentTab,
  setSessionStartTab,
  reset,
  onTabActivated,
  onTabUpdated,
  onWindowFocusChanged,
} from '@/background/tab-tracker';

describe('tab-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reset();
  });

  describe('getState', () => {
    it('should return initial state', () => {
      const state = getState();
      expect(state.url).toBe('');
      expect(state.tabId).toBeNull();
      expect(state.isOutsideChrome).toBe(false);
      expect(state.sessionStartTabId).toBeNull();
    });
  });

  describe('refreshCurrentTab', () => {
    it('should update state from active tab', async () => {
      mockTabs.query.mockResolvedValue([
        { id: 42, url: 'https://docs.google.com/doc/123' },
      ]);

      await refreshCurrentTab();
      const state = getState();

      expect(state.url).toBe('https://docs.google.com/doc/123');
      expect(state.tabId).toBe(42);
      expect(state.isOutsideChrome).toBe(false);
    });

    it('should not overwrite state when no active tabs', async () => {
      // First set a known state
      mockTabs.query.mockResolvedValue([
        { id: 42, url: 'https://docs.google.com/doc/123' },
      ]);
      await refreshCurrentTab();

      // Now query returns empty
      mockTabs.query.mockResolvedValue([]);
      await refreshCurrentTab();

      // State should remain from previous refresh (module only updates if tab?.url)
      const state = getState();
      expect(state.tabId).toBe(42);
      expect(state.url).toBe('https://docs.google.com/doc/123');
    });

    it('should not crash and keep state on query error', async () => {
      // Set initial state
      mockTabs.query.mockResolvedValue([{ id: 10, url: 'https://known.com' }]);
      await refreshCurrentTab();

      // Query fails
      mockTabs.query.mockRejectedValue(new Error('No windows'));

      // Should not throw
      await refreshCurrentTab();
      const state = getState();
      // State should remain from the successful refresh
      expect(state.url).toBe('https://known.com');
    });
  });

  describe('setSessionStartTab / reset', () => {
    it('should set session start tab from current tab', async () => {
      mockTabs.query.mockResolvedValue([{ id: 10, url: 'https://example.com' }]);
      await refreshCurrentTab();
      setSessionStartTab();

      expect(getState().sessionStartTabId).toBe(10);
    });

    it('should clear sessionStartTabId on reset', async () => {
      mockTabs.query.mockResolvedValue([{ id: 10, url: 'https://example.com' }]);
      await refreshCurrentTab();
      setSessionStartTab();

      reset();
      expect(getState().sessionStartTabId).toBeNull();
    });
  });

  describe('onTabActivated', () => {
    it('should update tabId and URL when user switches tab', async () => {
      mockTabs.get.mockResolvedValue({
        id: 77,
        url: 'https://notion.so/workspace',
      });

      await onTabActivated({ tabId: 77, windowId: 1 });

      const state = getState();
      expect(state.tabId).toBe(77);
      expect(state.url).toBe('https://notion.so/workspace');
      expect(state.isOutsideChrome).toBe(false);
    });

    it('should handle tab get failure gracefully', async () => {
      mockTabs.get.mockRejectedValue(new Error('Tab closed'));

      await onTabActivated({ tabId: 99, windowId: 1 });
      // tabId is set even if URL fetch fails
      expect(getState().tabId).toBe(99);
    });
  });

  describe('onTabUpdated', () => {
    it('should update URL when active tab navigates', async () => {
      // First set a tab as current
      mockTabs.query.mockResolvedValue([{ id: 5, url: 'https://old.com' }]);
      await refreshCurrentTab();

      onTabUpdated(
        5,
        { url: 'https://new-domain.com/page' },
        { id: 5, active: true, url: 'https://new-domain.com/page' } as chrome.tabs.Tab,
      );

      expect(getState().url).toBe('https://new-domain.com/page');
    });

    it('should ignore URL changes on non-active tabs', () => {
      onTabUpdated(
        99,
        { url: 'https://hidden.com' },
        { id: 99, active: false, url: 'https://hidden.com' } as chrome.tabs.Tab,
      );

      // URL should not change
      expect(getState().url).not.toBe('https://hidden.com');
    });

    it('should ignore changes without URL', () => {
      onTabUpdated(
        5,
        { status: 'loading' },
        { id: 5, active: true } as chrome.tabs.Tab,
      );

      // No crash, URL unchanged
      expect(getState().url).toBeDefined();
    });
  });

  describe('onWindowFocusChanged', () => {
    it('should mark as outside Chrome when window loses focus', () => {
      onWindowFocusChanged(WINDOW_ID_NONE);

      const state = getState();
      expect(state.isOutsideChrome).toBe(true);
      expect(state.url).toBe('__outside_chrome__');
    });

    it('should mark as inside Chrome when window regains focus', async () => {
      // 先 leave Chrome
      onWindowFocusChanged(WINDOW_ID_NONE);
      expect(getState().isOutsideChrome).toBe(true);

      // Return to Chrome
      mockTabs.query.mockResolvedValue([{ id: 1, url: 'https://back.com' }]);
      onWindowFocusChanged(1);

      expect(getState().isOutsideChrome).toBe(false);
    });
  });
});
