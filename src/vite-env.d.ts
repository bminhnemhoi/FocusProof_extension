/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev/demo cục bộ: gọi OpenAI trực tiếp. KHÔNG dùng cho bản phát hành. */
  readonly VITE_OPENAI_API_KEY: string;
  /** Khuyến nghị: URL backend proxy giữ key server-side (an toàn). */
  readonly VITE_AI_PROXY_URL: string;
  /** Tùy chọn: endpoint nhận analytics/error events (vd .../api/events). */
  readonly VITE_ANALYTICS_URL: string;
  /** Tùy chọn: base URL trang verify chứng chỉ (vd https://focusproof.com). */
  readonly VITE_VERIFY_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ============================================================
// Web Speech API (non-standard, Chrome-only)
// ============================================================

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}
