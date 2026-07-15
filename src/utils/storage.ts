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

  // Pruning: giữ tối đa 100 phiên gần nhất để tránh vượt quota 10MB
  const MAX_SESSIONS = 100;
  const pruned = history.length > MAX_SESSIONS
    ? history.slice(history.length - MAX_SESSIONS)
    : history;

  await set('sessionHistory', pruned);
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
// Backup / Restore (sao lưu dữ liệu)
// ============================================================

/** Phiên bản schema của file sao lưu — tăng khi đổi cấu trúc. */
const BACKUP_SCHEMA_VERSION = 1;

/** Số phiên tối đa giữ lại sau khi merge (đồng bộ với addToHistory). */
const MAX_SESSIONS = 100;

/** Cấu trúc file sao lưu JSON. */
export interface BackupFile {
  schemaVersion: number;
  exportedAt: string; // ISO 8601
  data: {
    sessionHistory: SessionData[];
    badges: Record<string, boolean>;
    fp_analytics_events: unknown[];
    fp_install_id: string | null;
  };
}

/** Kết quả nhập dữ liệu. */
export interface ImportResult {
  imported: { sessions: number; badges: number };
  /** Số phiên hỏng trong file bị bỏ qua. */
  skipped: number;
}

/**
 * Xuất toàn bộ dữ liệu người dùng thành chuỗi JSON có versioning.
 * KHÔNG gồm currentSession (phiên đang chạy — trạng thái tạm thời).
 * fp_analytics_events + fp_install_id chỉ để chẩn đoán, không nhập lại.
 */
export async function exportAllData(): Promise<string> {
  const [sessionHistory, badges, analyticsRes] = await Promise.all([
    getSessionHistory(),
    getBadges(),
    chrome.storage.local.get(['fp_analytics_events', 'fp_install_id']),
  ]);

  const backup: BackupFile = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      sessionHistory,
      badges,
      fp_analytics_events: (analyticsRes['fp_analytics_events'] as unknown[] | undefined) ?? [],
      fp_install_id: (analyticsRes['fp_install_id'] as string | undefined) ?? null,
    },
  };
  return JSON.stringify(backup, null, 2);
}

/** Kiểm một phần tử sessionHistory trong file sao lưu có hợp lệ không. */
function isValidSession(s: unknown): s is SessionData {
  if (typeof s !== 'object' || s === null) return false;
  const obj = s as Record<string, unknown>;
  return (
    typeof obj.id === 'string' && obj.id.length > 0
    && typeof obj.startTime === 'number' && Number.isFinite(obj.startTime)
    && Array.isArray(obj.samples)
  );
}

/**
 * Nhập dữ liệu từ file sao lưu JSON (do exportAllData tạo ra).
 * - Validate chặt: schemaVersion, cấu trúc sessionHistory/badges.
 * - Phần tử session hỏng bị BỎ QUA (đếm vào `skipped`), không làm fail cả file.
 * - MERGE với dữ liệu hiện có: session trùng id không nhân đôi, badges OR.
 * - Sau merge cắt về tối đa 100 phiên gần nhất (theo startTime).
 * @throws Error message tiếng Việt khi file không hợp lệ.
 */
export async function importAllData(json: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('File sao lưu không hợp lệ: nội dung không phải JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('File sao lưu không hợp lệ: thiếu cấu trúc dữ liệu.');
  }
  const backup = parsed as Partial<BackupFile>;

  if (backup.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `File sao lưu không được hỗ trợ (schemaVersion=${String(backup.schemaVersion)}, cần ${BACKUP_SCHEMA_VERSION}).`,
    );
  }
  if (typeof backup.data !== 'object' || backup.data === null) {
    throw new Error('File sao lưu không hợp lệ: thiếu trường "data".');
  }

  const rawSessions = (backup.data as { sessionHistory?: unknown }).sessionHistory ?? [];
  if (!Array.isArray(rawSessions)) {
    throw new Error('File sao lưu không hợp lệ: "sessionHistory" phải là mảng.');
  }

  const rawBadges = (backup.data as { badges?: unknown }).badges ?? {};
  if (typeof rawBadges !== 'object' || rawBadges === null || Array.isArray(rawBadges)) {
    throw new Error('File sao lưu không hợp lệ: "badges" phải là object {tên: boolean}.');
  }

  // ── Lọc session hợp lệ, đếm số bỏ qua ──
  const validSessions: SessionData[] = [];
  let skipped = 0;
  for (const s of rawSessions) {
    if (isValidSession(s)) validSessions.push(s);
    else skipped++;
  }

  // ── Merge sessionHistory: trùng id không nhân đôi ──
  const current = await getSessionHistory();
  const existingIds = new Set(current.map((s) => s.id));
  const newSessions = validSessions.filter((s) => !existingIds.has(s.id));

  const merged = [...current, ...newSessions]
    .sort((a, b) => a.startTime - b.startTime);
  const pruned = merged.length > MAX_SESSIONS
    ? merged.slice(merged.length - MAX_SESSIONS)
    : merged;

  // ── Merge badges: OR (chỉ nhận giá trị boolean) ──
  const currentBadges = await getBadges();
  const mergedBadges: Record<string, boolean> = { ...currentBadges };
  let newBadgeCount = 0;
  for (const [key, value] of Object.entries(rawBadges as Record<string, unknown>)) {
    if (typeof value !== 'boolean') continue; // bỏ qua entry không phải boolean
    if (value && !mergedBadges[key]) newBadgeCount++;
    mergedBadges[key] = mergedBadges[key] || value;
  }

  await set('sessionHistory', pruned);
  await set('badges', mergedBadges);

  return {
    imported: { sessions: newSessions.length, badges: newBadgeCount },
    skipped,
  };
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
  exportAllData,
  importAllData,
} as const;
