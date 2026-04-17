/**
 * FocusProof – Background Service Worker (Orchestrator)
 * Entry point: message routing, Chrome event wiring, startup recovery.
 * Tất cả logic nghiệp vụ được delegate sang các module chuyên biệt.
 *
 * Module map:
 * - session-manager.ts  → session lifecycle, sampling loop, finalize
 * - tab-tracker.ts      → tab/window state, Multi-Tab Guard
 * - goal-manager.ts     → goal evaluation integration
 * - alert-manager.ts    → realtime alert state
 * - offscreen-manager.ts → offscreen document (camera)
 */

import type { ChromeMessage, SessionConfig } from '@/utils/types';
import * as sessionManager from './session-manager';
import * as tabTracker from './tab-tracker';
import * as alertManager from './alert-manager';

// ============================================================
// Tab & Window Tracking (Realtime Chrome Events)
// ============================================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!sessionManager.isRunning()) return;
  await tabTracker.onTabActivated(activeInfo);
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!sessionManager.isRunning()) return;
  tabTracker.onTabUpdated(_tabId, changeInfo, tab);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (!sessionManager.isRunning()) return;
  tabTracker.onWindowFocusChanged(windowId);

  // Notify user when they leave Chrome (if external apps not allowed)
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    const session = sessionManager.getSession();
    if (session && !session.config.allowExternalApps) {
      chrome.notifications.create('focusproof-outside-chrome', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('public/icons/icon128.png'),
        title: 'FocusProof – Cảnh báo',
        message: 'Bạn đã rời khỏi Chrome! Quay lại để duy trì điểm tập trung.',
        priority: 2,
      });
    }
  }
});

// ============================================================
// Message Listener
// ============================================================

chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_SESSION':
        sessionManager.startSession(message.payload as SessionConfig)
          .then((result) => sendResponse(result))
          .catch((err) => sendResponse({ error: String(err) }));
        return true; // async response

      case 'STOP_SESSION':
        sessionManager.stopSession()
          .then((result) => sendResponse(result))
          .catch((err) => sendResponse({ error: String(err) }));
        return true;

      case 'SESSION_STATUS':
        sendResponse({
          status: sessionManager.getSession()?.status ?? 'idle',
          session: sessionManager.getSession(),
          alertCount: alertManager.getCount(),
          alertHistory: alertManager.getHistory(),
          lastResult: sessionManager.getLastResult(),
        });
        return false;

      case 'CLEAR_LAST_RESULT':
        sessionManager.clearLastResult();
        sendResponse({ success: true });
        return false;

      case 'OFFSCREEN_READY':
        console.warn('[BG] Offscreen document ready');
        return false;

      default:
        return false;
    }
  },
);

// ============================================================
// Startup – Restore session if SW was restarted
// ============================================================

sessionManager.restoreSession();
