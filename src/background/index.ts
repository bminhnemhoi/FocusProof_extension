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
import { track, logError, installGlobalErrorHandlers } from '@/utils/analytics';
import { registerCertificate } from '@/utils/certificate-signing';

// Bắt mọi lỗi runtime chưa xử lý trong service worker (tiêu chí: error logging)
installGlobalErrorHandlers('background');

// ============================================================
// Tab & Window Tracking (Realtime Chrome Events)
// ============================================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!sessionManager.isRunning()) return;

  // Dọn widget ở tab CŨ — fire-and-forget (không await để không chậm)
  const prevTabId = tabTracker.getState().tabId;
  if (prevTabId && prevTabId !== activeInfo.tabId) {
    chrome.tabs.sendMessage(prevTabId, { type: 'STOP_SESSION', payload: null }).catch(() => {});
  }

  await tabTracker.onTabActivated(activeInfo);

  // Inject content script + widget vào tab mới
  const injected = await sessionManager.ensureContentScript(activeInfo.tabId);
  if (injected) {
    try {
      await chrome.tabs.sendMessage(activeInfo.tabId, {
        type: 'START_SESSION',
        payload: sessionManager.getStartSessionPayload(),
      });
    } catch {
      // Content script may already be tracking on this tab
    }
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (!sessionManager.isRunning()) return;
  tabTracker.onTabUpdated(_tabId, changeInfo, tab);

  // Khi page load xong trên tab active → re-inject widget (xử lý navigation giữa session)
  if (changeInfo.status === 'complete' && tab.active && tab.url && /^https?:/.test(tab.url)) {
    sessionManager.ensureContentScript(_tabId).then((ok) => {
      if (ok) {
        chrome.tabs.sendMessage(_tabId, {
          type: 'START_SESSION',
          payload: sessionManager.getStartSessionPayload(),
        }).catch(() => {});
      }
    }).catch(() => {});
  }
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
      case 'START_SESSION': {
        const cfg = message.payload as SessionConfig;
        sessionManager.startSession(cfg)
          .then((result) => {
            if ((result as { success?: boolean }).success) {
              void track('session_started', {
                mode: cfg.mode,
                camera: cfg.cameraEnabled,
                strict: cfg.strictMode,
                duration: cfg.durationMinutes,
              });
            }
            sendResponse(result);
          })
          .catch((err) => {
            void logError('background:start_session', err);
            sendResponse({ error: String(err) });
          });
        return true; // async response
      }

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
// Web App External Messaging (Phase 10)
// ============================================================
// `externally_connectable` cho phép site focusproof.com gọi trực tiếp.
// Dùng cho các thao tác đọc trạng thái + ghi nhận đăng nhập web.

chrome.runtime.onMessageExternal?.addListener((message: ChromeMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'PING':
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      return false;

    case 'SESSION_STATUS':
      sendResponse({
        status: sessionManager.getSession()?.status ?? 'idle',
        session: sessionManager.getSession(),
        lastResult: sessionManager.getLastResult(),
      });
      return false;

    case 'SET_USER':
      chrome.storage.local
        .set({ focusproof_web_user: message.payload })
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ error: String(err) }));
      return true;

    default:
      sendResponse({ error: 'UNKNOWN_REQUEST_TYPE' });
      return false;
  }
});

/**
 * Broadcast một event tới tất cả tab focusproof.com đang mở.
 * Dùng khi session vừa hoàn thành để Dashboard tự cập nhật.
 */
async function broadcastToWebTabs(type: string, payload: unknown): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({
      url: [
        'https://focusproof.com/*',
        'https://www.focusproof.com/*',
        'https://*.vercel.app/*',
        'http://localhost:5173/*',
        'http://127.0.0.1:5173/*',
      ],
    });
    await Promise.allSettled(
      tabs.map((t) =>
        t.id
          ? chrome.tabs.sendMessage(t.id, {
              type: 'BROADCAST_TO_WEB',
              payload: { type, payload },
            })
          : Promise.resolve(),
      ),
    );
  } catch {
    /* no permission / no tabs → skip */
  }
}

// Hook session-manager để tự động broadcast + ghi nhận analytics khi finalize.
sessionManager.onFinalized?.((result) => {
  broadcastToWebTabs('SESSION_FINALIZED', result);
  // Đăng ký chứng chỉ với backend để có xác thực THẬT (no-op nếu chưa cấu hình)
  void registerCertificate(result);
  // Bucket điểm (không log điểm thô để giữ tính tổng hợp)
  const score = result.finalScore ?? 0;
  const scoreBucket = score >= 85 ? 'A+' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D-';
  void track('session_completed', {
    scoreBucket,
    alerts: result.alerts?.length ?? 0,
    samples: result.samples.length,
    camera: result.config.cameraEnabled,
  });
});

// ============================================================
// Startup – Restore session if SW was restarted
// ============================================================

// Watchdog: chrome.alarms đánh thức SW nếu bị kill giữa phiên → nối lại sampling
chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === sessionManager.SESSION_WATCHDOG_ALARM) {
    sessionManager.watchdogCheck().catch((err) => logError('background:watchdog', err));
  }
});

sessionManager.restoreSession();
