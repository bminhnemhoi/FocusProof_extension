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
async function ensureContentScript(tabId: number): Promise<boolean> {
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

async function doSample(): Promise<void> {
  if (!currentSession || currentSession.status !== 'running') return;

  try {
    const config = currentSession.config;
  const goalConfig = goalManager.buildGoalConfig(config);

  // 1. Refresh tab state
  await tabTracker.refreshCurrentTab();
  let tabState = tabTracker.getState();

  // 2. Strict Mode check: only allow the tab where session started
  //    Force inside-Chrome evaluation so domain is checked against allowed list
  if (config.strictMode && tabState.sessionStartTabId !== null && tabState.tabId !== tabState.sessionStartTabId) {
    tabState = { ...tabState, isOutsideChrome: false };
  }

  // 3. Build tab result with goal evaluation
  const tabResult = goalManager.buildTabResult(tabState, goalConfig);

  // 4. Poll face (only if camera enabled)
  const faceResult: FaceResult = config.cameraEnabled
    ? await offscreen.pollFace()
    : { detected: false, confidence: 0 };

  // 5. Poll activity from content script
  const activityResult = await pollActivity(tabState.tabId);

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

  if (newAlerts.length > 0 && tabState.tabId) {
    await alertManager.sendToContentScript(tabState.tabId, newAlerts);
  }

  // 10. Send widget update to content script
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

  // 11. Persist session periodically (every 5 samples ≈ 30s)
  if (currentSession.samples.length % 5 === 0) {
    await storage.saveCurrentSession(currentSession);
  }

  // 12. Auto-stop if duration reached
  if (timeRemaining <= 0) {
    await stopSession();
  }
  } catch (err) {
    console.error('[BG] doSample error (session continues):', err);
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
// SHA-256 Hash Generation
// ============================================================

async function generateSessionHash(session: SessionData): Promise<string> {
  const payload = JSON.stringify({
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    finalScore: session.finalScore,
    totalSamples: session.samples.length,
    taskName: session.config.taskName,
  });

  const encoded = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
  const tabState = tabTracker.getState();
  if (tabState.tabId) {
    const injected = await ensureContentScript(tabState.tabId);
    if (injected) {
      try {
        await chrome.tabs.sendMessage(tabState.tabId, {
          type: 'START_SESSION',
          payload: null,
        });
      } catch {
        console.warn('[BG] START_SESSION send failed after injection');
      }
    } else {
      console.warn('[BG] Content script not available on tab', tabState.tabId);
    }
  }

  await storage.saveCurrentSession(currentSession);

  // Start the 6-second sampling loop
  startSamplingLoop();

  console.warn('[BG] Session started:', sessionId);
  return { success: true, sessionId };
}

export async function stopSession() {
  if (!currentSession) {
    return { error: 'No active session' };
  }

  // Stop sampling
  stopSamplingLoop();

  // Finalize session
  currentSession.status = 'finished';
  currentSession.endTime = Date.now();

  // Calculate final score (0-100)
  currentSession.finalScore = calculateFinalScore(currentSession.samples);

  // Generate SHA-256 hash for integrity verification
  currentSession.hash = await generateSessionHash(currentSession);

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

  // Capture tab state BEFORE cleanup (tabId stays valid after reset)
  const tabState = tabTracker.getState();

  // Cleanup internal state
  currentSession = null;
  alertManager.reset();
  tabTracker.reset();
  await storage.clearCurrentSession();

  // Stop content script tracking
  if (tabState.tabId) {
    try {
      await chrome.tabs.sendMessage(tabState.tabId, {
        type: 'STOP_SESSION',
        payload: null,
      });
    } catch {
      // Content script may not be available
    }
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
    alertManager.init();
    console.warn('[BG] Restored running session:', saved.id);

    // Restore tab tracking
    await tabTracker.refreshCurrentTab();
    tabTracker.setSessionStartTab();

    // Re-create offscreen if camera was enabled
    if (saved.config.cameraEnabled) {
      const created = await offscreen.ensureDocument();
      if (created) {
        await offscreen.initCamera();
      }
    }

    // Resume sampling
    startSamplingLoop();
  }
}
