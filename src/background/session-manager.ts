/**
 * FocusProof – Session Manager
 * Quản lý toàn bộ session lifecycle: start → sampling → stop → finalize.
 *
 * Responsibilities:
 * - Tạo/hủy session
 * - Sampling loop 6 giây (poll face, activity, evaluate goal, tính score)
 * - Finalize: final score, SHA-256 hash, gamification badges
 * - Session recovery khi Service Worker restart
 */

import type {
  SessionData,
  SessionConfig,
  Sample,
  FaceResult,
  ActivityResult,
} from '@/utils/types';
import { SAMPLING_INTERVAL_MS } from '@/utils/types';
import { storage } from '@/utils/storage';
import { calculateSampleScore, calculateFinalScore } from '@/utils/focus';
import { computeIntegrityHash } from '@/utils/certificate-signing';
import { checkBadges, mergeBadges } from '@/utils/gamification';

import * as offscreen from './offscreen-manager';
import * as tabTracker from './tab-tracker';
import * as goalManager from './goal-manager';
import * as alertManager from './alert-manager';

// ============================================================
// State
// ============================================================

let currentSession: SessionData | null = null;
let samplingIntervalId: ReturnType<typeof setInterval> | null = null;
/** Kết quả session gần nhất (popup có thể đọc khi reopen) */
let lastFinishedSession: SessionData | null = null;

// ============================================================
// Content Script Injection Helper
// ============================================================

/**
 * Đảm bảo content script đã được inject vào tab.
 * Nếu tab đã mở trước khi extension load/reload, declarative content_scripts
 * sẽ KHÔNG tự inject → dùng chrome.scripting.executeScript fallback.
 */
export async function ensureContentScript(tabId: number): Promise<boolean> {
  // 0. Kiểm tra tab URL — content scripts không chạy trên chrome:// và chrome-extension://
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && /^(chrome|chrome-extension|edge|about|devtools):/i.test(tab.url)) {
      console.warn('[BG] Cannot inject content script into', tab.url);
      return false;
    }
  } catch {
    // Tab may not exist
    return false;
  }

  // 1. Thử PING content script
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { type: 'PING', payload: null });
    if (resp?.alive) return true;
  } catch {
    // Content script chưa có → inject
  }

  // 2. Lấy content script path từ manifest
  const manifest = chrome.runtime.getManifest();
  const csFiles = manifest.content_scripts?.[0]?.js;
  if (!csFiles || csFiles.length === 0) {
    console.warn('[BG] No content_scripts files found in manifest');
    return false;
  }

  // 3. Inject programmatically
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: csFiles,
    });
  } catch (err) {
    console.warn('[BG] Programmatic injection failed:', err);
    return false;
  }

  // 4. Confirm injection — content script registers listeners synchronously
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { type: 'PING', payload: null });
    return !!resp?.alive;
  } catch {
    // Injection succeeded but PING failed — still proceed optimistically
    return true;
  }
}

/** URL pattern cho các trang KHÔNG thể inject content script */
const NON_INJECTABLE_RE = /^(chrome|chrome-extension|edge|about|devtools|file):/i;

/**
 * Tìm tab web có thể inject content script.
 * Ưu tiên: 1) tab active hiện tại, 2) tab web gần nhất trong cửa sổ hiện tại.
 */
export async function findInjectableTab(): Promise<number | null> {
  // 1. Thử tab active trước
  try {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (active?.id && active.url && !NON_INJECTABLE_RE.test(active.url)) {
      return active.id;
    }
  } catch { /* ignore */ }

  // 2. Fallback: tìm tab web gần nhất trong cửa sổ hiện tại
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    // Ưu tiên tab có lastAccessed gần nhất hoặc index cao nhất
    const webTabs = tabs
      .filter((t) => t.id && t.url && !NON_INJECTABLE_RE.test(t.url))
      .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
    if (webTabs.length > 0 && webTabs[0].id) {
      console.warn('[BG] Active tab not injectable, using fallback tab:', webTabs[0].url);
      return webTabs[0].id;
    }
  } catch { /* ignore */ }

  // 3. Không tìm được tab nào injectable
  console.warn('[BG] No injectable web tab found');
  return null;
}

// ============================================================
// Getters
// ============================================================

export function getSession(): SessionData | null {
  return currentSession;
}

export function isRunning(): boolean {
  return currentSession?.status === 'running';
}

/** Lấy session vừa kết thúc (dùng khi popup reopen) */
export function getLastResult(): SessionData | null {
  return lastFinishedSession;
}

/** Clear last result sau khi popup đã đọc */
export function clearLastResult(): void {
  lastFinishedSession = null;
}

// ============================================================
// Finalize Listeners (Phase 10 — web sync)
// ============================================================

type FinalizedListener = (result: SessionData) => void;
const finalizedListeners: FinalizedListener[] = [];

/** Đăng ký callback chạy khi session vừa kết thúc (sau khi tinh điểm + hash). */
export function onFinalized(cb: FinalizedListener): () => void {
  finalizedListeners.push(cb);
  return () => {
    const idx = finalizedListeners.indexOf(cb);
    if (idx >= 0) finalizedListeners.splice(idx, 1);
  };
}

function emitFinalized(result: SessionData): void {
  for (const cb of finalizedListeners) {
    try {
      cb(result);
    } catch (err) {
      console.warn('[BG] onFinalized listener error', err);
    }
  }
}

// ============================================================
// Polling – Content Script
// ============================================================

async function pollActivity(tabId: number | null): Promise<ActivityResult> {
  if (!tabId) {
    return { keystrokes: 0, clicks: 0, scrolls: 0, idle: true };
  }
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'GET_ACTIVITY',
      payload: null,
    });
    if (response && typeof response.keystrokes === 'number') {
      return response as ActivityResult;
    }
  } catch {
    // Content script may not be injected on this tab
  }
  return { keystrokes: 0, clicks: 0, scrolls: 0, idle: true };
}

// ============================================================
// Sampling Loop (mỗi 6 giây)
// ============================================================

/** Guard chống doSample chạy chồng (tick 6s có thể đến khi tick trước chưa xong) */
let sampleInFlight = false;

async function doSample(): Promise<void> {
  if (!currentSession || currentSession.status !== 'running') return;
  if (sampleInFlight) return;
  sampleInFlight = true;

  try {
    const config = currentSession.config;
  const goalConfig = goalManager.buildGoalConfig(config);

  // 1. Refresh tab state
  await tabTracker.refreshCurrentTab();
  const tabState = tabTracker.getState();

  // 2. Strict Mode: phiên hứa "chỉ dùng 1 tab" — chuyển sang tab khác là
  //    vi phạm thật (trước đây chỉ ép đánh giá domain của tab mới, tức
  //    điều kiện người dùng bật lên không hề được thực thi).
  const strictViolation =
    config.strictMode &&
    !tabState.isOutsideChrome &&
    tabState.sessionStartTabId !== null &&
    tabState.tabId !== null &&
    tabState.tabId !== tabState.sessionStartTabId;

  // 3. Build tab result with goal evaluation
  let tabResult = goalManager.buildTabResult(tabState, goalConfig);
  if (strictViolation) {
    tabResult = { ...tabResult, isAllowed: false };
  }

  // 4. Poll face (only if camera enabled)
  const faceResult: FaceResult = config.cameraEnabled
    ? await offscreen.pollFace()
    : { detected: false, confidence: 0 };

  // 5. Poll activity from content script
  const activityResult = await pollActivity(tabState.tabId);

  // Session có thể đã bị stop trong lúc chờ các poll ở trên — bỏ sample này
  // để không ghi thêm dữ liệu sau khi finalScore/hash đã được tính.
  if (!currentSession || (currentSession as SessionData).status !== 'running') return;

  // 6. Goal compliance for this sample
  const goalCompliant = tabResult.isAllowed;

  // 7. Calculate focus score for this sample
  const focusScore = calculateSampleScore(
    faceResult,
    activityResult,
    goalCompliant,
    config.cameraEnabled,
  );

  // 8. Build sample
  const sample: Sample = {
    timestamp: Date.now(),
    face: faceResult,
    activity: activityResult,
    tab: tabResult,
    focusScore,
    goalCompliant,
  };

  currentSession.samples.push(sample);

  // 9. Check alerts & send to content script
  const newAlerts = alertManager.processAlerts({
    faceDetected: faceResult.detected,
    isIdle: activityResult.idle,
    goalCompliant,
    isOutsideChrome: tabResult.isOutsideChrome,
    cameraEnabled: config.cameraEnabled,
    goalConfig,
  });

  // 9b. Persist alerts vào session (nguồn sự thật cho thống kê cuối phiên +
  //     AI). Ghi ngay trong loop để không mất khi Service Worker bị kill.
  if (newAlerts.length > 0) {
    (currentSession.alerts ??= []).push(...newAlerts);
  }

  // 10. Send widget update TRƯỚC alerts (widget phải tồn tại để hiển thị toast)
  const elapsed = Date.now() - currentSession.startTime;
  const totalMs = config.durationMinutes * 60 * 1000;
  const timeRemaining = Math.max(0, totalMs - elapsed);

  try {
    if (tabState.tabId) {
      await chrome.tabs.sendMessage(tabState.tabId, {
        type: 'WIDGET_UPDATE',
        payload: {
          focusScore,
          timeRemaining,
          faceDetected: faceResult.detected,
          isIdle: activityResult.idle,
          goalCompliant,
        },
      });
    }
  } catch {
    // Content script may not be available
  }

  // 11. Send alerts SAU widget update
  if (newAlerts.length > 0 && tabState.tabId) {
    await alertManager.sendToContentScript(tabState.tabId, newAlerts);
  }

  // 12. Persist session: định kỳ mỗi 5 samples (~30s), và NGAY khi có alert
  //     mới để thống kê cảnh báo không mất nếu Service Worker bị kill
  if (newAlerts.length > 0 || currentSession.samples.length % 5 === 0) {
    await storage.saveCurrentSession(currentSession);
  }

  // 13. Auto-stop if duration reached
  if (timeRemaining <= 0) {
    await stopSession();
  }
  } catch (err) {
    console.error('[BG] doSample error (session continues):', err);
  } finally {
    sampleInFlight = false;
  }
}

function startSamplingLoop(): void {
  if (samplingIntervalId) clearInterval(samplingIntervalId);

  // First sample immediately
  doSample().catch((err) => console.error('[BG] Sample error:', err));

  samplingIntervalId = setInterval(() => {
    doSample().catch((err) => console.error('[BG] Sample error:', err));
  }, SAMPLING_INTERVAL_MS);
}

function stopSamplingLoop(): void {
  if (samplingIntervalId) {
    clearInterval(samplingIntervalId);
    samplingIntervalId = null;
  }
}

// ============================================================
// SHA-256 Integrity Fingerprint
// ============================================================
// Dùng nguồn hash CHUNG (certificate-signing.ts) để tránh trùng lặp logic và
// bảo đảm hash khớp giữa lúc tạo và lúc verify. Xem ghi chú minh bạch trong
// certificate-signing.ts: đây là dấu vân tay toàn vẹn, không phải chữ ký số.

// ============================================================
// Session Lifecycle
// ============================================================

export async function startSession(config: SessionConfig) {
  // Prevent double start
  if (currentSession && currentSession.status === 'running') {
    return { error: 'Session already running' };
  }

  const sessionId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  currentSession = {
    id: sessionId,
    config,
    status: 'running',
    startTime: Date.now(),
    samples: [],
    alerts: [],
    badges: [],
  };

  alertManager.init();

  // Record current tab for potential Strict Mode
  await tabTracker.refreshCurrentTab();
  tabTracker.setSessionStartTab();

  // Create offscreen document for camera (if enabled)
  if (config.cameraEnabled) {
    const created = await offscreen.ensureDocument();
    if (created) {
      const cameraOk = await offscreen.initCamera();
      if (!cameraOk) {
        // Camera failed → switch to Camera-Off mode, session continues
        console.warn('[BG] Camera init failed — switching to Camera-Off mode');
        currentSession.config = { ...currentSession.config, cameraEnabled: false };
      }
    } else {
      // Offscreen creation failed → Camera-Off mode
      console.warn('[BG] Offscreen creation failed — Camera-Off mode');
      currentSession.config = { ...currentSession.config, cameraEnabled: false };
    }
  }

  // Notify content script to start tracking
  // Tìm tab web có thể inject — không phụ thuộc vào tab active (có thể là chrome://)
  const targetTabId = await findInjectableTab();
  if (targetTabId) {
    const injected = await ensureContentScript(targetTabId);
    if (injected) {
      try {
        await chrome.tabs.sendMessage(targetTabId, {
          type: 'START_SESSION',
          payload: getStartSessionPayload(),
        });
        console.warn('[BG] Widget injected on tab', targetTabId);
      } catch {
        console.warn('[BG] START_SESSION send failed after injection');
      }
    } else {
      console.warn('[BG] Content script not available on tab', targetTabId);
    }
  } else {
    console.warn('[BG] No web tab found — widget will appear when you switch to a web page');
  }

  await storage.saveCurrentSession(currentSession);

  // Start the 6-second sampling loop
  startSamplingLoop();

  // Watchdog backstop: setInterval chết cùng Service Worker nếu Chrome kill
  // SW giữa phiên; chrome.alarms là event duy nhất chắc chắn đánh thức SW dậy
  // để restoreSession() nối lại sampling.
  try {
    await chrome.alarms?.create(SESSION_WATCHDOG_ALARM, { periodInMinutes: 0.5 });
  } catch {
    // alarms API không khả dụng (test env) → bỏ qua
  }

  console.warn('[BG] Session started:', sessionId);
  return { success: true, sessionId };
}

/**
 * Payload gửi kèm START_SESSION cho content script.
 * captureTyped mặc định FALSE — nội dung gõ chỉ được thu khi người dùng
 * opt-in rõ ràng trong cấu hình phiên (yêu cầu user-data policy của Web Store).
 */
export function getStartSessionPayload(): { captureTyped: boolean } {
  return { captureTyped: currentSession?.config.captureTypedContent === true };
}

/** Tên alarm watchdog cho phiên đang chạy */
export const SESSION_WATCHDOG_ALARM = 'fp_session_watchdog';

/**
 * Gọi từ chrome.alarms.onAlarm: nếu SW vừa bị kill giữa phiên (state RAM mất,
 * sampling loop chết) → khôi phục từ storage; nếu session còn trong RAM nhưng
 * loop đã chết → nối lại loop.
 */
export async function watchdogCheck(): Promise<void> {
  if (!currentSession) {
    await restoreSession();
    // Không còn phiên chạy trong storage → dọn alarm
    if (!currentSession) {
      try {
        await chrome.alarms?.clear(SESSION_WATCHDOG_ALARM);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  if (currentSession.status === 'running' && !samplingIntervalId) {
    console.warn('[BG] Watchdog: sampling loop dead — restarting');
    startSamplingLoop();
  }
}

export async function stopSession() {
  if (!currentSession) {
    return { error: 'No active session' };
  }
  // Idempotency guard: auto-stop (hết giờ) và user bấm Stop có thể gọi gần
  // như đồng thời → lần gọi thứ hai sẽ thấy status != 'running' và dừng ở
  // đây, tránh finalize 2 lần (lịch sử/chứng chỉ/analytics bị nhân đôi).
  if (currentSession.status !== 'running') {
    return { error: 'Session already stopping' };
  }

  // Stop sampling
  stopSamplingLoop();

  // Finalize session
  currentSession.status = 'finished';
  currentSession.endTime = Date.now();

  // Calculate final score (0-100)
  currentSession.finalScore = calculateFinalScore(currentSession.samples);

  // Generate SHA-256 integrity fingerprint (nguồn hash chung)
  currentSession.hash = await computeIntegrityHash(currentSession);

  // Check badges (gamification)
  const earnedBadges = checkBadges(currentSession);
  currentSession.badges = earnedBadges;

  // Merge into persistent badge storage
  const existingBadges = await storage.getBadges();
  const mergedBadges = mergeBadges(existingBadges, earnedBadges);
  await storage.updateBadges(mergedBadges);

  // Save to history
  await storage.addToHistory(currentSession);

  const result = { ...currentSession };

  // Save as last finished session (popup can read on reopen)
  lastFinishedSession = result as SessionData;

  // Notify external listeners (web sync, analytics…)
  emitFinalized(result as SessionData);

  // Cleanup internal state
  currentSession = null;
  alertManager.reset();
  tabTracker.reset();
  await storage.clearCurrentSession();
  try {
    await chrome.alarms?.clear(SESSION_WATCHDOG_ALARM);
  } catch {
    /* alarms API không khả dụng → bỏ qua */
  }

  // Stop content script tracking — gửi STOP_SESSION đến TẤT CẢ tab
  // (widget có thể tồn tại trên nhiều tab mà user đã ghé qua trong session)
  try {
    const allTabs = await chrome.tabs.query({});
    await Promise.allSettled(
      allTabs.map((tab) =>
        tab.id
          ? chrome.tabs.sendMessage(tab.id, { type: 'STOP_SESSION', payload: null })
          : Promise.resolve(),
      ),
    );
  } catch {
    // Tabs API may not be available
  }

  // Destroy offscreen document
  await offscreen.destroyDocument();

  console.warn('[BG] Session stopped, score:', result.finalScore);
  return { success: true, session: result };
}

// ============================================================
// Session Recovery (khi Service Worker restart)
// ============================================================

export async function restoreSession(): Promise<void> {
  const saved = await storage.getCurrentSession();
  if (saved && saved.status === 'running') {
    currentSession = saved;
    // Tương thích ngược: phiên lưu trước bản cập nhật chưa có mảng alerts
    if (!currentSession.alerts) currentSession.alerts = [];
    alertManager.init();
    console.warn('[BG] Restored running session:', saved.id);

    // Restore tab tracking
    await tabTracker.refreshCurrentTab();
    tabTracker.setSessionStartTab();

    // Re-create offscreen if camera was enabled
    if (saved.config.cameraEnabled) {
      const created = await offscreen.ensureDocument();
      const cameraOk = created ? await offscreen.initCamera() : false;
      if (!cameraOk) {
        // Giống startSession: camera hỏng → hạ về Camera-Off để trọng số
        // chuyển sang 60/40, tránh mất oan 40% điểm face sau khi SW restart
        console.warn('[BG] Camera re-init failed after SW restart — Camera-Off mode');
        currentSession.config = { ...currentSession.config, cameraEnabled: false };
      }
    }

    // Resume sampling
    startSamplingLoop();
  }
}
