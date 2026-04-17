/**
 * FocusProof – Chrome Storage Wrapper
 * Type-safe wrapper cho chrome.storage.local
 * Tất cả dữ liệu lưu 100% cục bộ (privacy-first).
 */

import type { StorageSchema, SessionData, UserSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

type StorageKey = keyof StorageSchema;

/** Đọc một key từ chrome.storage.local */
async function get<K extends StorageKey>(key: K): Promise<StorageSchema[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as StorageSchema[K] | undefined;
}

/** Ghi một key vào chrome.storage.local */
async function set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/** Xóa một key khỏi storage */
async function remove(key: StorageKey): Promise<void> {
  await chrome.storage.local.remove(key);
}

// ============================================================
// Session
// ============================================================

/** Lấy session hiện tại (đang chạy) */
export async function getCurrentSession(): Promise<SessionData | null> {
  return (await get('currentSession')) ?? null;
}

/** Lưu session hiện tại */
export async function saveCurrentSession(session: SessionData): Promise<void> {
  await set('currentSession', session);
}

/** Xóa session hiện tại */
export async function clearCurrentSession(): Promise<void> {
  await remove('currentSession');
}

// ============================================================
// Session History
// ============================================================

/** Lấy toàn bộ lịch sử phiên */
export async function getSessionHistory(): Promise<SessionData[]> {
  return (await get('sessionHistory')) ?? [];
}

/** Thêm một phiên đã hoàn thành vào lịch sử */
export async function addToHistory(session: SessionData): Promise<void> {
  const history = await getSessionHistory();
  history.push(session);
  await set('sessionHistory', history);
}

// ============================================================
// Settings
// ============================================================

/** Lấy cài đặt người dùng */
export async function getSettings(): Promise<UserSettings> {
  return (await get('settings')) ?? DEFAULT_SETTINGS;
}

/** Cập nhật cài đặt */
export async function updateSettings(partial: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await set('settings', { ...current, ...partial });
}

// ============================================================
// Allowed Domains
// ============================================================

/** Lấy danh sách domain được phép (user custom) */
export async function getAllowedDomains(): Promise<string[]> {
  return (await get('allowedDomains')) ?? [];
}

/** Lưu danh sách domain */
export async function saveAllowedDomains(domains: string[]): Promise<void> {
  await set('allowedDomains', domains);
}

// ============================================================
// Badges
// ============================================================

/** Lấy trạng thái huy hiệu */
export async function getBadges(): Promise<Record<string, boolean>> {
  return (await get('badges')) ?? {};
}

/** Cập nhật huy hiệu */
export async function updateBadges(badges: Record<string, boolean>): Promise<void> {
  const current = await getBadges();
  await set('badges', { ...current, ...badges });
}

// ============================================================
// Export namespace
// ============================================================

export const storage = {
  get,
  set,
  remove,
  getCurrentSession,
  saveCurrentSession,
  clearCurrentSession,
  getSessionHistory,
  addToHistory,
  getSettings,
  updateSettings,
  getAllowedDomains,
  saveAllowedDomains,
  getBadges,
  updateBadges,
} as const;
