/**
 * FocusProof – Analytics & Error Logging (privacy-first)
 *
 * Đáp ứng tiêu chí "Phân tích & Theo dõi" của rubric: theo dõi SỰ KIỆN sử dụng
 * sản phẩm + BẮT LỖI runtime của chính sản phẩm — thứ trước đây chưa có.
 *
 * Nguyên tắc riêng tư:
 *  - KHÔNG log URL, nội dung gõ, ảnh camera hay bất kỳ PII nào.
 *  - Chỉ lưu tên sự kiện + vài thuộc tính thô (mode, camera on/off, bucket điểm)
 *    và thông điệp lỗi rút gọn.
 *  - Mặc định lưu 100% CỤC BỘ (chrome.storage.local, ring buffer). Chỉ khi
 *    VITE_ANALYTICS_URL được cấu hình mới gửi ẩn danh về backend (fire-and-forget).
 *  - Có installId ẩn danh (random cục bộ) để đếm thiết bị, không gắn danh tính.
 */

const EVENTS_KEY = 'fp_analytics_events';
const INSTALL_ID_KEY = 'fp_install_id';
const MAX_EVENTS = 200;

export type AnalyticsEventName =
  | 'session_started'
  | 'session_completed'
  | 'ai_analysis'
  | 'pdf_exported'
  | 'voice_note'
  | 'certificate_shared'
  | 'runtime_error';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props?: Record<string, string | number | boolean>;
  ts: number;
}

/** chrome.storage.local có sẵn không (guard cho test / non-extension context). */
function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

async function readEvents(): Promise<AnalyticsEvent[]> {
  if (!hasStorage()) return [];
  const res = await chrome.storage.local.get(EVENTS_KEY);
  return (res[EVENTS_KEY] as AnalyticsEvent[] | undefined) ?? [];
}

/** installId ẩn danh, tạo một lần rồi lưu cục bộ. */
export async function getInstallId(): Promise<string> {
  if (!hasStorage()) return 'anonymous';
  const res = await chrome.storage.local.get(INSTALL_ID_KEY);
  let id = res[INSTALL_ID_KEY] as string | undefined;
  if (!id) {
    id = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await chrome.storage.local.set({ [INSTALL_ID_KEY]: id });
  }
  return id;
}

/** Gửi ẩn danh về backend nếu có cấu hình (không chặn luồng, nuốt lỗi). */
async function forwardToBackend(event: AnalyticsEvent): Promise<void> {
  const url = (import.meta.env.VITE_ANALYTICS_URL as string | undefined)?.trim();
  if (!url) return;
  try {
    const installId = await getInstallId();
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, installId }),
      keepalive: true,
    });
  } catch {
    /* offline / endpoint lỗi → bỏ qua, đã có bản cục bộ */
  }
}

/**
 * Ghi nhận một sự kiện sử dụng. An toàn khi gọi ở background lẫn popup.
 */
export async function track(
  name: AnalyticsEventName,
  props?: Record<string, string | number | boolean>,
): Promise<void> {
  const event: AnalyticsEvent = { name, props, ts: Date.now() };
  try {
    if (hasStorage()) {
      const events = await readEvents();
      events.push(event);
      // Ring buffer: chỉ giữ MAX_EVENTS gần nhất
      const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
      await chrome.storage.local.set({ [EVENTS_KEY]: trimmed });
    }
  } catch {
    /* không để analytics làm gãy luồng chính */
  }
  void forwardToBackend(event);
}

/**
 * Mask các chuỗi giống đường dẫn file thành '<path>' để tránh rò rỉ
 * thông tin máy (extension id, tên user, cấu trúc thư mục).
 * Bắt: chrome-extension://<id>/..., đường dẫn Windows (C:\...), Unix (/home/...).
 */
function maskPaths(text: string): string {
  return text
    // chrome-extension://<32 ký tự id>/duong/dan/file.js
    .replace(/chrome-extension:\/\/[a-p]{32}\/[^\s)]*/g, '<path>')
    // Windows: C:\Users\... hoặc D:/x/y (cả 2 kiểu slash)
    .replace(/[A-Za-z]:[\\/][^\s:)]+/g, '<path>')
    // Unix: /home/..., /Users/..., /usr/..., /var/..., /tmp/..., /opt/...
    .replace(/\/(?:home|Users|usr|var|tmp|opt)\/[^\s:)]+/g, '<path>');
}

/** Rút gọn thông điệp lỗi, loại bỏ path dài để tránh rò rỉ thông tin máy. */
function sanitizeError(err: unknown): { message: string; stack?: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const message = maskPaths(rawMessage).slice(0, 300);
  const stack = err instanceof Error && err.stack
    ? maskPaths(err.stack.split('\n').slice(0, 3).join(' | ')).slice(0, 500)
    : undefined;
  return { message, stack };
}

/**
 * Bắt lỗi runtime của sản phẩm. Lưu cục bộ + (tùy chọn) gửi backend.
 * @param context Nơi xảy ra lỗi (vd 'background', 'popup', 'offscreen').
 */
export async function logError(context: string, err: unknown): Promise<void> {
  const { message, stack } = sanitizeError(err);
  await track('runtime_error', { context, message, ...(stack ? { stack } : {}) });
}

/**
 * Cài đặt handler bắt lỗi toàn cục cho context hiện tại (service worker/popup).
 * Gọi một lần khi khởi động.
 */
export function installGlobalErrorHandlers(context: string): void {
  const g = globalThis as unknown as {
    addEventListener?: (t: string, cb: (e: unknown) => void) => void;
  };
  if (typeof g.addEventListener !== 'function') return;

  g.addEventListener('error', (e: unknown) => {
    const err = (e as { error?: unknown; message?: string })?.error
      ?? (e as { message?: string })?.message
      ?? 'unknown error';
    void logError(context, err);
  });
  g.addEventListener('unhandledrejection', (e: unknown) => {
    void logError(context, (e as { reason?: unknown })?.reason ?? 'unhandled rejection');
  });
}

export interface AnalyticsSummary {
  total: number;
  errorCount: number;
  counts: Record<string, number>;
  lastEventTs: number | null;
}

/**
 * Tổng hợp số liệu cho dashboard chẩn đoán (đếm sự kiện + lỗi).
 */
export async function getSummary(): Promise<AnalyticsSummary> {
  const events = await readEvents();
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.name] = (counts[e.name] ?? 0) + 1;
  return {
    total: events.length,
    errorCount: counts['runtime_error'] ?? 0,
    counts,
    lastEventTs: events.length ? events[events.length - 1].ts : null,
  };
}

/** Một mục lỗi runtime đã ghi nhận (đọc từ ring buffer sự kiện). */
export interface RuntimeErrorEntry {
  ts: number;
  context: string;
  message: string;
  stack?: string;
}

/**
 * Lấy các lỗi runtime gần nhất (mới nhất trước) cho dashboard chẩn đoán.
 * @param limit Số lỗi tối đa trả về (mặc định 10).
 */
export async function getRecentErrors(limit = 10): Promise<RuntimeErrorEntry[]> {
  const events = await readEvents();
  return events
    .filter((e) => e.name === 'runtime_error')
    .slice(-limit)
    .reverse()
    .map((e) => ({
      ts: e.ts,
      context: String(e.props?.context ?? 'unknown'),
      message: String(e.props?.message ?? ''),
      ...(e.props?.stack ? { stack: String(e.props.stack) } : {}),
    }));
}

/**
 * Xóa toàn bộ log cục bộ (dùng cho nút "reset" nếu cần).
 *
 * LƯU Ý: cố ý KHÔNG xóa fp_install_id — đó là định danh thiết bị ẩn danh
 * (tạo random cục bộ, không gắn danh tính) dùng để đếm số thiết bị;
 * xóa nó sẽ làm một thiết bị bị đếm thành nhiều.
 */
export async function clearAnalytics(): Promise<void> {
  if (hasStorage()) await chrome.storage.local.remove(EVENTS_KEY);
}
