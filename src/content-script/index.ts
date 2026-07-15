/**
 * FocusProof – Content Script
 * Chịu trách nhiệm:
 * 1. Activity tracking (keyboard IME-aware, mouse, scroll, paste/drop, idle)
 * 2. Typed content capture (500 ký tự cuối cho AI)
 * 3. Floating Widget injection & realtime update (Phase 2)
 *
 * Chạy trên mọi trang web (matches: <all_urls>).
 * Tất cả event listeners dùng AbortController để cleanup khi stop.
 */

import type { ChromeMessage, ActivityResult, AlertEvent } from '@/utils/types';
import { IDLE_THRESHOLD_MS, TYPED_CONTENT_MAX_CHARS } from '@/utils/types';
import {
  createWidget,
  destroyWidget,
  updateWidget,
  showAlert,
} from './widget';
import type { WidgetUpdatePayload } from './widget';
import { initWebBridge, broadcastToWeb } from './web-bridge';

// ============================================================
// Duplicate Injection Guard
// ============================================================
// Mỗi lần inject tạo execution context mới.
// Dùng DOM marker để tránh đăng ký listener trùng lặp.
const GUARD_ATTR = '__focusproof_cs_loaded__';
if ((window as unknown as Record<string, unknown>)[GUARD_ATTR]) {
  // Đã có content script trên page này → skip
  // Vẫn log để debug, nhưng không setup listeners
  console.warn('[FocusProof] Content script already loaded, skipping duplicate');
} else {
  (window as unknown as Record<string, unknown>)[GUARD_ATTR] = true;
  _initContentScript();
}

function _initContentScript(): void {

// ============================================================
// Activity Tracking State
// ============================================================

let isTracking = false;
let activityBuffer: ActivityResult = createEmptyBuffer();
let lastActivityTime = Date.now();
let abortController: AbortController | null = null;

/** Bộ đệm nội dung gõ (500 ký tự cuối) cho AI Analysis */
let typedContentBuffer = '';
/** Flag để detect IME composing state */
let isComposing = false;
/**
 * Chỉ thu NỘI DUNG gõ khi background bật cờ này (người dùng opt-in trong
 * cấu hình phiên). Mặc định TẮT — đếm số keystroke vẫn hoạt động bình thường
 * (tín hiệu activity chỉ cần số lượng, không cần nội dung).
 */
let captureTyped = false;

/**
 * Trường nhạy cảm KHÔNG BAO GIỜ được thu nội dung, kể cả khi đã opt-in:
 * mật khẩu, OTP, số thẻ, và các input tự khai autocomplete nhạy cảm.
 */
function isSensitiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLInputElement)) return false;
  const type = (target.type || '').toLowerCase();
  if (type === 'password' || type === 'email' || type === 'tel') return true;
  const autocomplete = (target.autocomplete || '').toLowerCase();
  return (
    autocomplete.includes('password') ||
    autocomplete.includes('cc-') ||
    autocomplete.includes('one-time-code')
  );
}

function createEmptyBuffer(): ActivityResult {
  return { keystrokes: 0, clicks: 0, scrolls: 0, idle: true };
}

// ============================================================
// Activity Tracking
// ============================================================

function startTracking() {
  if (isTracking) return;
  isTracking = true;
  lastActivityTime = Date.now();
  activityBuffer = createEmptyBuffer();

  abortController = new AbortController();
  const { signal } = abortController;

  // --- IME-aware Keyboard Tracking ---
  // compositionstart/end: detect khi user đang gõ tiếng Việt qua IME
  document.addEventListener(
    'compositionstart',
    () => { isComposing = true; },
    { signal },
  );

  document.addEventListener(
    'compositionend',
    (e: CompositionEvent) => {
      isComposing = false;
      // Khi IME commit → đếm 1 keystroke cho toàn bộ chuỗi composition
      activityBuffer.keystrokes++;
      markActive();
      // Capture typed content từ IME — không thu từ trường nhạy cảm
      if (e.data && !isSensitiveTarget(e.target)) {
        appendTypedContent(e.data);
      }
    },
    { signal },
  );

  // keydown: chỉ đếm khi KHÔNG đang composing (tránh double count)
  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (isComposing) return; // Skip IME intermediate keystrokes
      activityBuffer.keystrokes++;
      markActive();

      // Capture single key input (non-IME) — không thu từ trường nhạy cảm
      // (mật khẩu/OTP/thẻ): chỉ đếm keystroke, không lưu ký tự
      if (e.key.length === 1 && !isSensitiveTarget(e.target)) {
        appendTypedContent(e.key);
      }
    },
    { signal },
  );

  // --- Mouse clicks ---
  document.addEventListener(
    'click',
    () => {
      activityBuffer.clicks++;
      markActive();
    },
    { signal },
  );

  // --- Mouse movement (chỉ đánh dấu active, không đếm) ---
  document.addEventListener(
    'mousemove',
    () => { markActive(); },
    { signal, passive: true },
  );

  // --- Scroll ---
  document.addEventListener(
    'scroll',
    () => {
      activityBuffer.scrolls++;
      markActive();
    },
    { signal, passive: true },
  );

  // --- Input events (catches typing in contentEditable, Monaco editors, etc.) ---
  document.addEventListener(
    'input',
    () => {
      if (!isComposing) {
        markActive();
      }
    },
    { signal, passive: true },
  );

  // --- Focus/blur tracking (detect window & element focus changes) ---
  window.addEventListener(
    'focus',
    () => { markActive(); },
    { signal },
  );

  document.addEventListener(
    'focusin',
    () => { markActive(); },
    { signal, passive: true },
  );

  // --- Touch events (mobile / touch-enabled devices) ---
  document.addEventListener(
    'touchstart',
    () => {
      activityBuffer.clicks++;
      markActive();
    },
    { signal, passive: true },
  );

  // --- Paste ---
  document.addEventListener(
    'paste',
    (e: ClipboardEvent) => {
      markActive();
      // Capture pasted text — không thu khi dán vào trường nhạy cảm
      if (isSensitiveTarget(e.target)) return;
      const pasted = e.clipboardData?.getData('text') ?? '';
      if (pasted) {
        appendTypedContent(pasted);
      }
    },
    { signal },
  );

  // --- Drop ---
  document.addEventListener(
    'drop',
    () => { markActive(); },
    { signal },
  );
}

function stopTracking() {
  isTracking = false;
  isComposing = false;
  abortController?.abort();
  abortController = null;
  activityBuffer = createEmptyBuffer();
}

function markActive() {
  lastActivityTime = Date.now();
  activityBuffer.idle = false;
}

function appendTypedContent(text: string) {
  // Người dùng chưa opt-in → không lưu bất kỳ nội dung nào
  if (!captureTyped) return;
  typedContentBuffer += text;
  // Giữ chỉ 500 ký tự cuối
  if (typedContentBuffer.length > TYPED_CONTENT_MAX_CHARS) {
    typedContentBuffer = typedContentBuffer.slice(-TYPED_CONTENT_MAX_CHARS);
  }
}

/**
 * Lấy dữ liệu activity hiện tại và reset buffer.
 * Background gọi mỗi 6s qua GET_ACTIVITY message.
 */
function flushActivity(): ActivityResult {
  const now = Date.now();

  // Cập nhật idle dựa trên thời gian không hoạt động
  if (now - lastActivityTime > IDLE_THRESHOLD_MS) {
    activityBuffer.idle = true;
  }

  const data = { ...activityBuffer };
  activityBuffer = createEmptyBuffer();
  return data;
}

// ============================================================
// Floating Widget
// ============================================================

function handleWidgetUpdate(payload: WidgetUpdatePayload) {
  updateWidget(payload);
}

function handleAlert(alert: AlertEvent) {
  showAlert(alert);
}

// ============================================================
// Message Listener
// ============================================================

chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_SESSION':
        typedContentBuffer = '';
        captureTyped =
          (message.payload as { captureTyped?: boolean } | null)?.captureTyped === true;
        startTracking();
        createWidget();
        sendResponse({ success: true });
        return false;

      case 'STOP_SESSION':
        stopTracking();
        destroyWidget();
        sendResponse({ success: true, typedContent: typedContentBuffer });
        typedContentBuffer = '';
        return false;

      case 'GET_ACTIVITY':
        // Background poll activity mỗi sampling cycle
        sendResponse(flushActivity());
        return false;

      case 'WIDGET_UPDATE':
        handleWidgetUpdate(message.payload as Parameters<typeof handleWidgetUpdate>[0]);
        sendResponse({ success: true });
        return false;

      case 'ALERT':
        handleAlert(message.payload as AlertEvent);
        sendResponse({ success: true });
        return false;

      case 'PING':
        sendResponse({
          alive: true,
          url: location.href,
          widgetExists: !!document.querySelector('focusproof-widget'),
          isTracking,
        });
        return false;

      case 'BROADCAST_TO_WEB':
        // Background đẩy event sang web (vd: SESSION_FINALIZED).
        broadcastToWeb(
          (message.payload as { type: string; payload: unknown }).type,
          (message.payload as { type: string; payload: unknown }).payload,
        );
        sendResponse({ success: true });
        return false;

      default:
        return false;
    }
  },
);

console.warn('[FocusProof] Content script loaded');

initWebBridge();

} // end _initContentScript
