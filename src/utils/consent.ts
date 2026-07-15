/**
 * FocusProof – Consent Storage
 * Đọc/ghi bản ghi đồng ý thu thập dữ liệu (Chrome Web Store user-data policy).
 * Lưu trực tiếp chrome.storage.local key `fp_consent`.
 * Tách khỏi ConsentScreen.tsx để component file chỉ export component
 * (yêu cầu react-refresh) và các hàm thuần test được độc lập.
 */

/** Key lưu consent trong chrome.storage.local */
export const CONSENT_STORAGE_KEY = 'fp_consent';

/** Bản ghi consent đã lưu */
export interface ConsentRecord {
  given: boolean;
  aiCloudOptIn: boolean;
  captureTyped: boolean;
  ts: number;
}

/**
 * Chuẩn hóa giá trị đọc từ storage (hàm thuần).
 * Trả null nếu chưa đồng ý hoặc dữ liệu không hợp lệ.
 */
export function parseConsent(raw: unknown): ConsentRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.given !== true) return null;
  const aiCloudOptIn = o.aiCloudOptIn === true;
  return {
    given: true,
    aiCloudOptIn,
    // captureTyped chỉ có nghĩa khi AI cloud đã bật
    captureTyped: aiCloudOptIn && o.captureTyped === true,
    ts: typeof o.ts === 'number' ? o.ts : 0,
  };
}

/**
 * Tạo bản ghi consent hợp lệ (hàm thuần).
 * Ràng buộc: captureTyped bị ép tắt nếu AI cloud tắt.
 */
export function buildConsent(
  aiCloudOptIn: boolean,
  captureTyped: boolean,
  now: number = Date.now(),
): ConsentRecord {
  return {
    given: true,
    aiCloudOptIn,
    captureTyped: aiCloudOptIn && captureTyped,
    ts: now,
  };
}

/** Đọc consent đã lưu — null nếu người dùng chưa đồng ý */
export async function readConsent(): Promise<ConsentRecord | null> {
  try {
    const res = await chrome.storage.local.get(CONSENT_STORAGE_KEY);
    return parseConsent(res[CONSENT_STORAGE_KEY]);
  } catch {
    return null;
  }
}

/** Ghi consent vào chrome.storage.local */
export async function saveConsent(record: ConsentRecord): Promise<void> {
  await chrome.storage.local.set({ [CONSENT_STORAGE_KEY]: record });
}
