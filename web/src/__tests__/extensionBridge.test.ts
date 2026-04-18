import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isInstalled,
  getInstalledVersion,
  ping,
  pushUserState,
  observeInstall,
} from '../services/extensionBridge';

describe('extensionBridge', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.focusproofExtension;
  });
  afterEach(() => {
    delete document.documentElement.dataset.focusproofExtension;
  });

  it('isInstalled false khi chưa có marker', () => {
    expect(isInstalled()).toBe(false);
    expect(getInstalledVersion()).toBeNull();
  });

  it('isInstalled true khi html có data-focusproof-extension', () => {
    document.documentElement.dataset.focusproofExtension = '1.2.3';
    expect(isInstalled()).toBe(true);
    expect(getInstalledVersion()).toBe('1.2.3');
  });

  it('ping timeout trả {ok:false} khi không có extension', async () => {
    const res = await ping();
    expect(res.ok).toBe(false);
  }, 3000);

  it('pushUserState resolve null khi extension không phản hồi', async () => {
    const res = await pushUserState({ plan: 'free', credits: 100, email: 'x@y.com' });
    expect(res).toBeNull();
  }, 3000);

  it('observeInstall emit ngay với state hiện tại', () => {
    const states: boolean[] = [];
    const unsub = observeInstall((ok) => states.push(ok));
    expect(states[0]).toBe(false);
    unsub();
  });

  it('ping nhận response khi có extension stub trả lời', async () => {
    // Stub: lắng nghe focusproof-web request, dispatch MessageEvent với source=window
    // (jsdom postMessage không đặt event.source = window).
    const handler = (event: MessageEvent) => {
      const data = event.data as { source?: string; id?: string; type?: string };
      if (data?.source === 'focusproof-web' && data.type === 'PING') {
        const reply = new MessageEvent('message', {
          data: {
            source: 'focusproof-extension',
            id: data.id,
            type: 'PING_RESPONSE',
            payload: { ok: true, version: '9.9.9' },
            version: '9.9.9',
          },
          source: window,
        });
        window.dispatchEvent(reply);
      }
    };
    window.addEventListener('message', handler);

    const res = await ping();
    window.removeEventListener('message', handler);

    expect(res.ok).toBe(true);
    expect(res.version).toBe('9.9.9');
  });
});
