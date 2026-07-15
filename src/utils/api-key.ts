/**
 * FocusProof – AI Credentials & Endpoint Configuration
 *
 * ⚠️ LƯU Ý BẢO MẬT (trung thực):
 * XOR + base64 dưới đây CHỈ là "che mắt" (obfuscation), KHÔNG phải mã hóa.
 * Bất kỳ ai cũng có thể đảo ngược. Vì vậy KHÔNG được nhúng OpenAI key thật
 * vào bản build phát hành — key sẽ lộ trong bundle.
 *
 * Kiến trúc khuyến nghị (an toàn):
 *   Extension  →  Backend proxy (giữ key)  →  OpenAI
 * Đặt VITE_AI_PROXY_URL trỏ tới backend; client không cần biết key.
 *
 * Đường dùng key trực tiếp (VITE_OPENAI_API_KEY) chỉ dành cho phát triển/demo
 * cục bộ và được ưu tiên THẤP hơn proxy.
 */

const XOR_KEY = 'FocusProof2026';

/** Encode/decode string bằng XOR với key cố định */
function xorCipher(input: string, key: string): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return output;
}

/** Encode string thành base64 XOR */
export function obfuscateKey(plainKey: string): string {
  const xored = xorCipher(plainKey, XOR_KEY);
  return btoa(xored);
}

/** Decode base64 XOR thành plain string */
export function deobfuscateKey(encoded: string): string {
  const xored = atob(encoded);
  return xorCipher(xored, XOR_KEY);
}

// Build time: lấy key từ env, obfuscate ngay
const RAW_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OBFUSCATED = RAW_KEY ? obfuscateKey(RAW_KEY) : null;

/**
 * Lấy API key đã giải mã (chỉ dùng khi user opt-in AI analysis).
 * Trả về null nếu key chưa được cấu hình.
 */
export function getApiKey(): string | null {
  if (!OBFUSCATED) return null;
  return deobfuscateKey(OBFUSCATED);
}

/**
 * URL backend proxy để gọi AI mà KHÔNG lộ key ở client (khuyến nghị).
 * Cấu hình qua VITE_AI_PROXY_URL, ví dụ: https://api.focusproof.com/ai-analyze
 * Trả về null nếu chưa cấu hình.
 */
export function getAIProxyUrl(): string | null {
  const url = (import.meta.env.VITE_AI_PROXY_URL as string | undefined)?.trim();
  return url ? url : null;
}

/** Có cấu hình AI remote (proxy hoặc key) hay không. */
export function isRemoteAIConfigured(): boolean {
  return getAIProxyUrl() !== null || getApiKey() !== null;
}
