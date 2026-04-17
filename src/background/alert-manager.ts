/**
 * FocusProof – Alert Manager
 * Quản lý trạng thái alert trong background context.
 * Wrap AlertState từ utils/alert-system.ts, thêm logic gửi alert đến content script.
 */

import type { GoalConfig, AlertEvent } from '@/utils/types';
import {
  createAlertState,
  checkAlerts,
  getAlertCount as getAlertCountFromState,
} from '@/utils/alert-system';
import type { AlertState } from '@/utils/alert-system';

// ============================================================
// State
// ============================================================

let alertState: AlertState | null = null;

// ============================================================
// Lifecycle
// ============================================================

/** Khởi tạo alert state mới cho session */
export function init(): void {
  alertState = createAlertState();
}

/** Reset alert state khi session kết thúc */
export function reset(): void {
  alertState = null;
}

// ============================================================
// Processing
// ============================================================

/** Tổng số alerts trong session hiện tại */
export function getCount(): number {
  return alertState ? getAlertCountFromState(alertState) : 0;
}

/** Lấy lịch sử alerts trong session hiện tại */
export function getHistory(): AlertEvent[] {
  return alertState ? alertState.alertHistory : [];
}

/**
 * Kiểm tra và phát alert dựa trên trạng thái hiện tại.
 * @returns Mảng alert mới được phát trong lần check này
 */
export function processAlerts(opts: {
  faceDetected: boolean;
  isIdle: boolean;
  goalCompliant: boolean;
  isOutsideChrome: boolean;
  cameraEnabled: boolean;
  goalConfig: GoalConfig;
}): AlertEvent[] {
  if (!alertState) return [];
  return checkAlerts(alertState, opts);
}

/**
 * Gửi alerts đến content script qua chrome.tabs.sendMessage.
 */
export async function sendToContentScript(
  tabId: number,
  alerts: AlertEvent[],
): Promise<void> {
  for (const alert of alerts) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'ALERT',
        payload: alert,
      });
    } catch {
      // Content script may not be available
    }
  }
}
