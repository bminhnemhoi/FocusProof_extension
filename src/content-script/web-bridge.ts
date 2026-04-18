/**
 * FocusProof — Content Script Web Bridge (Phase 10)
 *
 * Cầu nối giữa Web App (focusproof.com) và Extension Background:
 *  - Inject `data-focusproof-extension` vào <html> để web detect cài đặt.
 *  - Forward window.postMessage({source:'focusproof-web', ...}) → background.
 *  - Forward background broadcasts → window.postMessage({source:'focusproof-extension', ...}).
 *
 * CHỈ KÍCH HOẠT trên các domain đã whitelist để tránh leak data sang site khác.
 */

const EXTENSION_VERSION = '1.0.0';

const WEB_HOSTS = new Set<string>([
  'focusproof.com',
  'www.focusproof.com',
  'localhost',
  '127.0.0.1',
]);

function isAllowedHost(): boolean {
  if (WEB_HOSTS.has(window.location.hostname)) return true;
  // Allow Vercel preview domains (*.vercel.app)
  if (window.location.hostname.endsWith('.vercel.app')) return true;
  return false;
}

interface BridgeRequest {
  source: 'focusproof-web';
  id: string;
  type: 'PING' | 'GET_LAST_RESULT' | 'GET_STATUS' | 'SET_USER';
  payload?: unknown;
}

interface BridgeResponse {
  source: 'focusproof-extension';
  id?: string;
  type: string;
  payload?: unknown;
  version: string;
}

export function initWebBridge(): void {
  if (!isAllowedHost()) return;

  // 1. Marker để web detect — đặt vào <html> dataset.
  try {
    document.documentElement.dataset.focusproofExtension = EXTENSION_VERSION;
  } catch {
    /* readonly DOM (sandbox) → bỏ qua */
  }

  // 2. Lắng nghe request từ web.
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data as BridgeRequest | undefined;
    if (!data || data.source !== 'focusproof-web') return;

    handleWebRequest(data).then((response) => {
      window.postMessage(
        {
          source: 'focusproof-extension',
          id: data.id,
          type: `${data.type}_RESPONSE`,
          payload: response,
          version: EXTENSION_VERSION,
        } satisfies BridgeResponse,
        window.location.origin,
      );
    });
  });
}

async function handleWebRequest(req: BridgeRequest): Promise<unknown> {
  switch (req.type) {
    case 'PING':
      return { ok: true, version: EXTENSION_VERSION };

    case 'GET_LAST_RESULT':
    case 'GET_STATUS': {
      try {
        return await chrome.runtime.sendMessage({ type: 'SESSION_STATUS', payload: null });
      } catch (err) {
        return { error: String(err) };
      }
    }

    case 'SET_USER': {
      // Lưu vào chrome.storage.local để background có thể đọc khi cần (ví dụ
      // gọi AI thì check Pro plan trước). Không gọi background trực tiếp để
      // tránh side-effect — chỉ là sync state.
      try {
        await chrome.storage.local.set({ focusproof_web_user: req.payload });
        return { ok: true };
      } catch (err) {
        return { error: String(err) };
      }
    }

    default:
      return { error: 'UNKNOWN_REQUEST_TYPE' };
  }
}

/**
 * Phát một event từ extension sang web (vd: session vừa hoàn thành).
 * Background sẽ gọi qua chrome.tabs.sendMessage → content script → window.postMessage.
 */
export function broadcastToWeb(type: string, payload: unknown): void {
  if (!isAllowedHost()) return;
  window.postMessage(
    {
      source: 'focusproof-extension',
      type,
      payload,
      version: EXTENSION_VERSION,
    } satisfies BridgeResponse,
    window.location.origin,
  );
}
