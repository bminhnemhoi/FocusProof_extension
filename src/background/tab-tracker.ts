/**
 * FocusProof – Tab Tracker
 * Quản lý trạng thái tab/window realtime trong Chrome.
 * Cung cấp dữ liệu cho Goal Evaluation và Multi-Tab Guard.
 *
 * State được cập nhật qua:
 * - chrome.tabs.onActivated (tab switch)
 * - chrome.tabs.onUpdated (URL change)
 * - chrome.windows.onFocusChanged (leave/return Chrome)
 * - refreshCurrentTab() (polling thủ công)
 */

import { OUTSIDE_CHROME_MARKER } from '@/utils/types';

// ============================================================
// State
// ============================================================

let currentTabUrl = '';
let currentTabId: number | null = null;
let isOutsideChrome = false;
/** Tab mà session bắt đầu (dùng cho Strict Mode) */
let sessionStartTabId: number | null = null;

// ============================================================
// Public Interface
// ============================================================

export interface TabState {
  url: string;
  tabId: number | null;
  isOutsideChrome: boolean;
  sessionStartTabId: number | null;
}

/** Lấy snapshot trạng thái tab hiện tại */
export function getState(): TabState {
  return {
    url: currentTabUrl,
    tabId: currentTabId,
    isOutsideChrome,
    sessionStartTabId,
  };
}

/** Poll tab đang active để đồng bộ state */
export async function refreshCurrentTab(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      currentTabUrl = tab.url;
      currentTabId = tab.id ?? null;
      isOutsideChrome = false;
    }
  } catch {
    // Tabs API may fail if no windows
  }
}

/** Ghi nhận tab bắt đầu session (cho Strict Mode) */
export function setSessionStartTab(): void {
  sessionStartTabId = currentTabId;
}

/** Reset state liên quan đến session (khi stop) */
export function reset(): void {
  sessionStartTabId = null;
}

// ============================================================
// Chrome Event Handlers — gọi từ index.ts
// ============================================================

/** Xử lý khi user switch tab */
export async function onTabActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
  currentTabId = activeInfo.tabId;
  isOutsideChrome = false;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      currentTabUrl = tab.url;
    }
  } catch {
    // Tab may have been closed
  }
}

/** Xử lý khi URL của tab thay đổi */
export function onTabUpdated(
  _tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
): void {
  // Only track URL changes for the active tab
  if (tab.active && changeInfo.url) {
    currentTabUrl = changeInfo.url;
  }
}

/** Xử lý khi user rời/quay lại Chrome */
export function onWindowFocusChanged(windowId: number): void {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // User left Chrome → mark as outside
    isOutsideChrome = true;
    currentTabUrl = OUTSIDE_CHROME_MARKER;
  } else {
    isOutsideChrome = false;
    // Refresh tab URL when returning to Chrome
    refreshCurrentTab();
  }
}
