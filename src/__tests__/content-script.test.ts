/**
 * Unit tests cho content-script/index.ts
 * Test activity tracking, IME-aware keyboard handling, message listener.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// -------------------------------------------------------
// Mock widget module BEFORE importing content script
// -------------------------------------------------------
vi.mock('../content-script/widget', () => ({
  createWidget: vi.fn(),
  destroyWidget: vi.fn(),
  updateWidget: vi.fn(),
  showAlert: vi.fn(),
}));

// Spy on console.warn (the content script logs on load)
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Now import the content script – this triggers the side-effect registration
// The handler is captured via setup.ts's _listeners array
import '@/content-script/index';
import {
  createWidget,
  destroyWidget,
  updateWidget,
  showAlert,
} from '@/content-script/widget';

// Retrieve the message handler registered by the content script
const listeners = (chrome.runtime.onMessage as unknown as { _listeners: Array<(...args: unknown[]) => unknown> })._listeners;
const messageHandler = listeners[listeners.length - 1] as (
  message: { type: string; payload?: unknown },
  sender: unknown,
  sendResponse: (resp: unknown) => void,
) => boolean | void;

// Helper to send a message to the content script's listener
function sendMessage(type: string, payload?: unknown): unknown {
  let response: unknown = undefined;
  messageHandler(
    { type, payload },
    {}, // sender
    (resp: unknown) => { response = resp; },
  );
  return response;
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('content-script/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('message listener registration', () => {
    it('should register a chrome.runtime.onMessage listener', () => {
      expect(listeners.length).toBeGreaterThan(0);
      expect(typeof messageHandler).toBe('function');
    });
  });

  describe('START_SESSION → STOP_SESSION lifecycle', () => {
    it('should start tracking and create widget on START_SESSION', () => {
      const resp = sendMessage('START_SESSION');

      expect(resp).toEqual({ success: true });
      expect(createWidget).toHaveBeenCalled();
    });

    it('should stop tracking, destroy widget, return typedContent on STOP_SESSION', () => {
      sendMessage('START_SESSION');

      // Simulate some typing
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a' }),
      );
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'b' }),
      );

      const resp = sendMessage('STOP_SESSION') as Record<string, unknown>;

      expect(resp.success).toBe(true);
      expect(resp.typedContent).toBeDefined();
      expect(destroyWidget).toHaveBeenCalled();
    });

    it('should clear typedContentBuffer on START_SESSION', () => {
      // First session: type some content
      sendMessage('START_SESSION');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      sendMessage('STOP_SESSION');

      // Second session: buffer should be clean
      sendMessage('START_SESSION');
      const resp = sendMessage('STOP_SESSION') as Record<string, unknown>;

      // typedContent should be empty since we cleared on new START
      expect(resp.typedContent).toBe('');
    });
  });

  describe('GET_ACTIVITY', () => {
    it('should return activity data with idle=true initially', () => {
      sendMessage('START_SESSION');

      const activity = sendMessage('GET_ACTIVITY') as Record<string, unknown>;

      expect(activity).toHaveProperty('keystrokes');
      expect(activity).toHaveProperty('clicks');
      expect(activity).toHaveProperty('scrolls');
      expect(activity).toHaveProperty('idle');
    });

    it('should count keystrokes from keyboard events (non-IME)', () => {
      sendMessage('START_SESSION');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));

      const activity = sendMessage('GET_ACTIVITY') as Record<string, number>;
      expect(activity.keystrokes).toBe(2);
    });

    it('should count clicks', () => {
      sendMessage('START_SESSION');

      document.dispatchEvent(new MouseEvent('click'));
      document.dispatchEvent(new MouseEvent('click'));
      document.dispatchEvent(new MouseEvent('click'));

      const activity = sendMessage('GET_ACTIVITY') as Record<string, number>;
      expect(activity.clicks).toBe(3);
    });

    it('should count scrolls', () => {
      sendMessage('START_SESSION');

      document.dispatchEvent(new Event('scroll'));

      const activity = sendMessage('GET_ACTIVITY') as Record<string, number>;
      expect(activity.scrolls).toBe(1);
    });

    it('should reset buffer after flush (GET_ACTIVITY)', () => {
      sendMessage('START_SESSION');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      sendMessage('GET_ACTIVITY'); // flush

      const secondFlush = sendMessage('GET_ACTIVITY') as Record<string, number>;
      expect(secondFlush.keystrokes).toBe(0);
    });

    it('should mark idle=false after recent activity', () => {
      sendMessage('START_SESSION');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));

      const activity = sendMessage('GET_ACTIVITY') as Record<string, boolean>;
      expect(activity.idle).toBe(false);
    });
  });

  describe('IME composition handling', () => {
    it('should ignore keydown during IME composition', () => {
      sendMessage('START_SESSION');

      // Start composition (IME)
      document.dispatchEvent(new CompositionEvent('compositionstart'));

      // These intermediate keystrokes should be ignored
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Process' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Process' }));

      // End composition with final text
      document.dispatchEvent(
        new CompositionEvent('compositionend', { data: 'việt' }),
      );

      const activity = sendMessage('GET_ACTIVITY') as Record<string, number>;
      // Only 1 keystroke from the compositionend, NOT 2 from keydown
      expect(activity.keystrokes).toBe(1);
    });
  });

  describe('WIDGET_UPDATE', () => {
    it('should call updateWidget with payload', () => {
      const payload = {
        focusScore: 90,
        timeRemaining: 120000,
        faceDetected: true,
        isIdle: false,
        goalCompliant: true,
      };

      sendMessage('WIDGET_UPDATE', payload);
      expect(updateWidget).toHaveBeenCalledWith(payload);
    });
  });

  describe('ALERT', () => {
    it('should call showAlert with the alert event', () => {
      const alert = {
        type: 'face_not_detected',
        message: 'Không phát hiện khuôn mặt',
        timestamp: Date.now(),
      };

      sendMessage('ALERT', alert);
      expect(showAlert).toHaveBeenCalledWith(alert);
    });
  });

  describe('unknown message', () => {
    it('should not crash on unknown message types', () => {
      expect(() => {
        sendMessage('UNKNOWN_TYPE', {});
      }).not.toThrow();
    });
  });

  describe('stop tracking cleanup', () => {
    it('should not count events after STOP_SESSION', () => {
      sendMessage('START_SESSION');
      sendMessage('STOP_SESSION');

      // Events after stop should not be counted
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
      document.dispatchEvent(new MouseEvent('click'));

      // Start a new session to get activity
      sendMessage('START_SESSION');
      const activity = sendMessage('GET_ACTIVITY') as Record<string, number>;

      // Should be 0 since previous events were after stop and new tracking just started fresh
      expect(activity.keystrokes).toBe(0);
      expect(activity.clicks).toBe(0);
    });
  });
});
