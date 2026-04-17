/**
 * FocusProof – Vitest Setup
 * Mock chrome API cho testing environment
 */

// Mock chrome.storage.local
const storageData: Record<string, unknown> = {};

const mockStorage = {
  get: (keys: string | string[]) => {
    const keyArr = typeof keys === 'string' ? [keys] : keys;
    const result: Record<string, unknown> = {};
    for (const key of keyArr) {
      if (key in storageData) {
        result[key] = storageData[key];
      }
    }
    return Promise.resolve(result);
  },
  set: (items: Record<string, unknown>) => {
    Object.assign(storageData, items);
    return Promise.resolve();
  },
  remove: (keys: string | string[]) => {
    const keyArr = typeof keys === 'string' ? [keys] : keys;
    for (const key of keyArr) {
      delete storageData[key];
    }
    return Promise.resolve();
  },
};

// Mock chrome.runtime
const messageListeners: Array<(...args: unknown[]) => unknown> = [];

const mockRuntime = {
  sendMessage: (_message: unknown, _callback?: (response: unknown) => void) => {},
  getManifest: () => ({
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['src/content-script/index.ts'],
        run_at: 'document_idle',
      },
    ],
  }),
  onMessage: {
    addListener: (callback: (...args: unknown[]) => unknown) => {
      messageListeners.push(callback);
    },
    removeListener: (_callback: unknown) => {},
    _listeners: messageListeners,
  },
};

// Assign to global
Object.defineProperty(globalThis, 'chrome', {
  value: {
    storage: { local: mockStorage },
    runtime: mockRuntime,
    tabs: {
      sendMessage: () => Promise.reject(new Error('Could not establish connection')),
      onActivated: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
    },
    scripting: {
      executeScript: () => Promise.resolve([]),
    },
    windows: {
      onFocusChanged: { addListener: () => {} },
      WINDOW_ID_NONE: -1,
    },
  },
  writable: true,
});
