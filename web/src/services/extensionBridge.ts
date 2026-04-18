/**
 * extensionBridge.ts — Cầu nối Web ↔ Extension (Phase 10)
 *
 * Cơ chế:
 *  - Detect: extension content script gắn `data-focusproof-extension` lên <html>.
 *  - Request/response: window.postMessage với `source: 'focusproof-web'` + id;
 *    extension trả về `source: 'focusproof-extension'` + id.
 *  - Broadcast: extension đẩy event qua window.postMessage (vd: SESSION_FINALIZED).
 *
 * KHÔNG cần biết EXTENSION_ID — content script cùng origin xử lý hết.
 */

import type { UserState } from '../types';

const REQUEST_TIMEOUT_MS = 1500;
const SOURCE_WEB = 'focusproof-web';
const SOURCE_EXT = 'focusproof-extension';

interface ExtensionResponse<T = unknown> {
  source: typeof SOURCE_EXT;
  id?: string;
  type: string;
  payload?: T;
  version?: string;
}

function newId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Có extension cài hay không (đọc dataset trên <html>). */
export function isInstalled(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.documentElement.dataset.focusproofExtension);
}

/** Phiên bản extension đang cài. */
export function getInstalledVersion(): string | null {
  if (typeof document === 'undefined') return null;
  return document.documentElement.dataset.focusproofExtension ?? null;
}

/** Theo dõi trạng thái cài đặt — gọi callback khi extension xuất hiện/biến mất. */
export function observeInstall(cb: (installed: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};
  let last = isInstalled();
  cb(last);
  const obs = new MutationObserver(() => {
    const cur = isInstalled();
    if (cur !== last) {
      last = cur;
      cb(cur);
    }
  });
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-focusproof-extension'],
  });
  return () => obs.disconnect();
}

/** Gửi 1 request và đợi response (timeout 1.5s). */
function request<T = unknown>(type: string, payload?: unknown): Promise<T | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const id = newId();
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, REQUEST_TIMEOUT_MS);

    function handler(event: MessageEvent) {
      if (event.source !== window) return;
      const data = event.data as ExtensionResponse<T> | undefined;
      if (!data || data.source !== SOURCE_EXT || data.id !== id) return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      resolve(data.payload ?? null);
    }

    window.addEventListener('message', handler);
    window.postMessage({ source: SOURCE_WEB, id, type, payload }, window.location.origin);
  });
}

/** Ping extension (true nếu trả lời trong 1.5s). */
export async function ping(): Promise<{ ok: boolean; version?: string }> {
  const res = await request<{ ok: boolean; version: string }>('PING');
  return res ?? { ok: false };
}

/** Đẩy user state sang extension (sau login / upgrade / consume credit). */
export function pushUserState(user: UserState | null): Promise<{ ok: boolean } | null> {
  return request<{ ok: boolean }>('SET_USER', user);
}

/** Lấy trạng thái session hiện tại + kết quả cuối cùng. */
export function getSessionStatus(): Promise<unknown | null> {
  return request<unknown>('GET_STATUS');
}

/** Lắng nghe sự kiện extension đẩy về (vd: SESSION_FINALIZED). */
export function onExtensionEvent(
  type: string,
  cb: (payload: unknown, version?: string) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  function handler(event: MessageEvent) {
    if (event.source !== window) return;
    const data = event.data as ExtensionResponse | undefined;
    if (!data || data.source !== SOURCE_EXT || data.type !== type) return;
    if (data.id) return; // bỏ qua response của request có id
    cb(data.payload, data.version);
  }
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

export const extensionBridge = {
  isInstalled,
  getInstalledVersion,
  observeInstall,
  ping,
  pushUserState,
  getSessionStatus,
  onExtensionEvent,
};

export default extensionBridge;
