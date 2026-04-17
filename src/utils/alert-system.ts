/**
 * FocusProof – Alert System
 * Logic cảnh báo realtime khi mất tập trung.
 * Reference: y_tuong.md Section 2.1 – Real-time Alert System
 *
 * Các loại cảnh báo:
 * - face-lost: Mất mặt > 8 giây
 * - idle: Không hoạt động > 25 giây
 * - tab-violation: Chuyển tab/domain không phù hợp
 * - outside-chrome: Rời Chrome khi "Allow external apps" = OFF
 */

import type { AlertType, AlertEvent, GoalConfig } from './types';
import { FACE_LOST_THRESHOLD_MS, IDLE_THRESHOLD_MS } from './types';

export interface AlertState {
  /** Timestamp lần cuối phát hiện mặt */
  lastFaceDetectedAt: number;
  /** Timestamp lần cuối có activity */
  lastActivityAt: number;
  /** Alert đang active (chưa resolve) */
  activeAlerts: Set<AlertType>;
  /** Lịch sử tất cả alerts trong session */
  alertHistory: AlertEvent[];
}

/** Khởi tạo state mới cho mỗi session */
export function createAlertState(): AlertState {
  const now = Date.now();
  return {
    lastFaceDetectedAt: now,
    lastActivityAt: now,
    activeAlerts: new Set(),
    alertHistory: [],
  };
}

/**
 * Kiểm tra và phát alert dựa trên trạng thái hiện tại.
 * Gọi mỗi sampling cycle (6s).
 *
 * @returns Mảng alert mới được phát trong lần check này
 */
export function checkAlerts(
  state: AlertState,
  opts: {
    faceDetected: boolean;
    isIdle: boolean;
    goalCompliant: boolean;
    isOutsideChrome: boolean;
    cameraEnabled: boolean;
    goalConfig: GoalConfig;
  },
): AlertEvent[] {
  const now = Date.now();
  const newAlerts: AlertEvent[] = [];

  // --- Face Lost ---
  if (opts.cameraEnabled) {
    if (opts.faceDetected) {
      state.lastFaceDetectedAt = now;
      state.activeAlerts.delete('face-lost');
    } else if (now - state.lastFaceDetectedAt > FACE_LOST_THRESHOLD_MS) {
      if (!state.activeAlerts.has('face-lost')) {
        state.activeAlerts.add('face-lost');
        const alert: AlertEvent = {
          type: 'face-lost',
          timestamp: now,
          message: 'Nhìn vào màn hình!',
        };
        newAlerts.push(alert);
        state.alertHistory.push(alert);
      }
    }
  }

  // --- Idle ---
  if (!opts.isIdle) {
    state.lastActivityAt = now;
    state.activeAlerts.delete('idle');
  } else if (now - state.lastActivityAt > IDLE_THRESHOLD_MS) {
    if (!state.activeAlerts.has('idle')) {
      state.activeAlerts.add('idle');
      const alert: AlertEvent = {
        type: 'idle',
        timestamp: now,
        message: 'Bạn đã không hoạt động quá lâu!',
      };
      newAlerts.push(alert);
      state.alertHistory.push(alert);
    }
  }

  // --- Tab Violation ---
  if (!opts.isOutsideChrome && !opts.goalCompliant) {
    if (!state.activeAlerts.has('tab-violation')) {
      state.activeAlerts.add('tab-violation');
      const alert: AlertEvent = {
        type: 'tab-violation',
        timestamp: now,
        message: 'Tab hiện tại không phù hợp mục tiêu!',
      };
      newAlerts.push(alert);
      state.alertHistory.push(alert);
    }
  } else if (!opts.isOutsideChrome && opts.goalCompliant) {
    state.activeAlerts.delete('tab-violation');
  }

  // --- Outside Chrome ---
  if (opts.isOutsideChrome && !opts.goalCompliant) {
    if (!state.activeAlerts.has('outside-chrome')) {
      state.activeAlerts.add('outside-chrome');
      const alert: AlertEvent = {
        type: 'outside-chrome',
        timestamp: now,
        message: 'Bạn đã rời khỏi Chrome!',
      };
      newAlerts.push(alert);
      state.alertHistory.push(alert);
    }
  } else if (!opts.isOutsideChrome) {
    state.activeAlerts.delete('outside-chrome');
  }

  return newAlerts;
}

/** Tổng số alerts trong session */
export function getAlertCount(state: AlertState): number {
  return state.alertHistory.length;
}
