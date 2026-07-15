/**
 * FocusProof – Offscreen Document Manager
 * Quản lý lifecycle của Offscreen Document (camera + MediaPipe).
 * Offscreen Document là cách duy nhất truy cập camera trong MV3.
 */

import type { FaceResult } from '@/utils/types';
import { logError } from '@/utils/analytics';

// ============================================================
// State
// ============================================================

let offscreenCreated = false;

// ============================================================
// Lifecycle
// ============================================================

/**
 * Đảm bảo Offscreen Document tồn tại. Nếu chưa có → tạo mới.
 * Trả về true nếu document sẵn sàng.
 */
export async function ensureDocument(): Promise<boolean> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
  });

  if (existingContexts.length > 0) {
    offscreenCreated = true;
    return true;
  }

  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/offscreen.html',
      reasons: ['USER_MEDIA' as chrome.offscreen.Reason],
      justification: 'Camera access for face detection (privacy-first: no images saved)',
    });
    offscreenCreated = true;
    return true;
  } catch (err) {
    console.error('[BG] Failed to create offscreen document:', err);
    void logError('background:offscreen_create', err);
    offscreenCreated = false;
    return false;
  }
}

/**
 * Hủy Offscreen Document và giải phóng camera.
 */
export async function destroyDocument(): Promise<void> {
  if (!offscreenCreated) return;
  try {
    await chrome.runtime.sendMessage({ type: 'DESTROY_OFFSCREEN', payload: null });
    await chrome.offscreen.closeDocument();
  } catch {
    // Document may already be closed
  }
  offscreenCreated = false;
}

/**
 * Gửi lệnh khởi tạo camera trong Offscreen Document.
 * Gọi sau khi ensureDocument() thành công.
 *
 * Retry logic:
 * - NotAllowedError / NotFoundError → fail immediately (permanent, no retry)
 * - Other errors → retry up to 3 times with increasing delay (offscreen may still be loading)
 */
export async function initCamera(): Promise<boolean> {
  const MAX_RETRIES = 3;
  const DELAYS = [200, 600, 1500]; // ms — shorter since permission is pre-granted in popup

  // Lỗi cuối cùng ghi nhận — log một lần khi bỏ cuộc để không spam analytics
  let lastError: unknown = 'unknown';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Wait for offscreen script to load
    await new Promise((r) => setTimeout(r, DELAYS[attempt]));

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_OFFSCREEN',
        payload: null,
      });
      if (response?.success) {
        console.warn('[BG] Camera initialized on attempt', attempt + 1);
        return true;
      }

      // Permanent failure — don't retry
      if (response?.error === 'NotAllowedError') {
        console.warn('[BG] Camera permission denied/dismissed — no retry');
        void logError('background:camera_init', 'NotAllowedError: permission denied/dismissed');
        return false;
      }
      if (response?.error === 'NotFoundError') {
        console.warn('[BG] No camera device found — no retry');
        void logError('background:camera_init', 'NotFoundError: no camera device');
        return false;
      }
      if (response?.error === 'NO_VIDEO_ELEMENT') {
        console.warn('[BG] Offscreen HTML missing video element — no retry');
        void logError('background:camera_init', 'NO_VIDEO_ELEMENT: offscreen HTML missing video element');
        return false;
      }

      // Other failure — continue to next attempt
      lastError = `attempt ${attempt + 1} failed: ${response?.error ?? 'unknown'}`;
      console.warn('[BG] Camera init attempt', attempt + 1, 'failed:', response?.error ?? 'unknown');
    } catch (err) {
      // Offscreen may not be ready yet (script still loading), retry
      lastError = err;
      console.warn('[BG] Camera init attempt', attempt + 1, 'error (offscreen not ready?):', err);
    }
  }

  console.warn('[BG] Camera init failed after', MAX_RETRIES, 'attempts — continuing without camera');
  void logError('background:camera_init', lastError);
  return false;
}

// ============================================================
// Polling
// ============================================================

/**
 * Poll kết quả face detection từ Offscreen Document.
 * Trả về FaceResult { detected, confidence }.
 */
export async function pollFace(): Promise<FaceResult> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_FACE',
      payload: null,
    });
    if (response && typeof response.detected === 'boolean') {
      return response as FaceResult;
    }
  } catch {
    // Offscreen may not be ready
  }
  return { detected: false, confidence: 0 };
}
