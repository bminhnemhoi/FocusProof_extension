/**
 * FocusProof – Certificate Integrity & Verification
 *
 * ⚠️ MINH BẠCH VỀ "CHỮ KÝ":
 * SHA-256 ở đây là **dấu vân tay toàn vẹn (integrity fingerprint)**, KHÔNG
 * phải chữ ký số. Nó chứng minh dữ liệu chưa bị sửa (đổi 1 ký tự → hash đổi),
 * NHƯNG không chứng minh "ai tạo ra" vì không có khóa bí mật — bất kỳ ai cũng
 * tính lại được cùng hash từ cùng dữ liệu.
 *
 * Để có xác thực THẬT (chống tự chế chứng chỉ), cần backend:
 *   1. Phiên kết thúc → client gửi bản tóm tắt + fingerprint lên backend.
 *   2. Backend LƯU bản ghi và ký bằng khóa server (HMAC/asymmetric).
 *   3. QR trỏ tới URL verify của backend → người xem đối chiếu bản ghi gốc.
 * Xem server/ (reference implementation) cho endpoint /api/certificates + /verify.
 *
 * Module này cung cấp:
 *   - computeIntegrityHash(): nguồn sự thật duy nhất cho SHA-256 (dedupe).
 *   - verifyIntegrity(): tự kiểm tra tại chỗ dữ liệu có bị sửa không.
 *   - getVerifyBaseUrl()/buildVerifyUrl(): URL verify khi có backend.
 */

import type { SessionData } from './types';
import { getGrade } from './focus';

/**
 * Payload chuẩn hóa (canonical) để băm. Thứ tự field cố định → hash ổn định.
 * Chỉ gồm các trường then chốt của chứng chỉ; đổi bất kỳ trường nào → hash đổi.
 */
export function buildCanonicalPayload(session: SessionData): string {
  return JSON.stringify({
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
    finalScore: session.finalScore,
    totalSamples: session.samples.length,
    taskName: session.config.taskName,
  });
}

/** Băm SHA-256 (hex) của payload chuẩn hóa. Nguồn sự thật duy nhất trong app. */
export async function computeIntegrityHash(session: SessionData): Promise<string> {
  const encoded = new TextEncoder().encode(buildCanonicalPayload(session));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface IntegrityCheck {
  valid: boolean;
  expected: string; // hash tính lại từ dữ liệu hiện tại
  actual: string; // hash đã lưu trong session
}

/**
 * Tự kiểm tra toàn vẹn: tính lại hash từ dữ liệu và so với hash đã lưu.
 * `valid=false` nghĩa là dữ liệu đã bị chỉnh sửa sau khi phát hành.
 */
export async function verifyIntegrity(session: SessionData): Promise<IntegrityCheck> {
  const expected = await computeIntegrityHash(session);
  const actual = session.hash ?? '';
  return { valid: !!actual && expected === actual, expected, actual };
}

/** Base URL trang verify của backend (nếu đã cấu hình). */
export function getVerifyBaseUrl(): string | null {
  const url = (import.meta.env.VITE_VERIFY_BASE_URL as string | undefined)?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

/**
 * URL verify công khai cho một chứng chỉ (khi có backend), ví dụ:
 *   https://focusproof.com/verify/fp_123?h=<hash8>
 * Trả về null nếu chưa cấu hình backend verify.
 */
export function buildVerifyUrl(session: SessionData): string | null {
  const base = getVerifyBaseUrl();
  if (!base) return null;
  const h = (session.hash ?? '').slice(0, 16);
  return `${base}/verify/${encodeURIComponent(session.id)}?h=${h}`;
}

/**
 * Đăng ký chứng chỉ với backend để có xác thực THẬT (server ký + lưu bản gốc).
 * Fire-and-forget: chỉ chạy khi VITE_VERIFY_BASE_URL được cấu hình; nuốt lỗi
 * để không ảnh hưởng luồng kết thúc phiên. Không gửi PII (chỉ tóm tắt điểm).
 */
export async function registerCertificate(session: SessionData): Promise<void> {
  const base = getVerifyBaseUrl();
  if (!base) return;
  try {
    const score = Math.round(session.finalScore ?? 0);
    await fetch(`${base}/api/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        id: session.id,
        hash: session.hash ?? '',
        score,
        grade: getGrade(session.finalScore ?? 0).grade,
        date: new Date(session.startTime).toISOString().slice(0, 10),
        task: session.config.taskName.slice(0, 120),
      }),
    });
  } catch {
    /* offline / backend lỗi → chứng chỉ vẫn dùng được ở chế độ tự chứng thực */
  }
}
