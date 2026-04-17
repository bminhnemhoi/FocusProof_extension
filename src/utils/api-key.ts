/**
 * FocusProof – API Key Obfuscation
 * XOR-based obfuscation cho API key (theo y_tuong.md: privacy-first).
 * KHÔNG hardcode secret trực tiếp trong source code.
 *
 * Luồng:
 * 1. Build time: Vite inject VITE_OPENAI_API_KEY từ .env
 * 2. Runtime: key được XOR-obfuscate trong memory
 * 3. Chỉ decode khi cần gọi API (opt-in)
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
