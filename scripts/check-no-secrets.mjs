/**
 * FocusProof – Secret Leak Guard
 * Quét thư mục (mặc định dist/) tìm API key bị nhúng vào bundle.
 *
 * Bài học thực tế: đặt VITE_OPENAI_API_KEY trong .env → Vite inline NGUYÊN VĂN
 * key vào dist/assets/*.js. Script này chạy sau mỗi build (CI + npm run package)
 * để chặn tái diễn.
 *
 * Dùng: node scripts/check-no-secrets.mjs [thư-mục]
 * Exit 1 nếu phát hiện secret.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const TARGET = process.argv[2] ?? 'dist';

/** Pattern các loại key phổ biến có thể lọt vào bundle */
const SECRET_PATTERNS = [
  { name: 'OpenAI API key', re: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'OpenAI key signature', re: /T3BlbkFJ/ },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Generic bearer secret', re: /(?:api[_-]?key|secret)["'\s:=]+["'][A-Za-z0-9_-]{32,}["']/i },
];

/** File nhị phân lớn — bỏ qua để không ngốn RAM/false positive */
const SKIP_EXT = new Set([
  '.wasm', '.tflite', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.otf', '.zip', '.pdf', '.mp4',
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let found = 0;
let scanned = 0;

try {
  for (const file of walk(TARGET)) {
    if (SKIP_EXT.has(extname(file).toLowerCase())) continue;
    scanned++;
    const content = readFileSync(file, 'utf8');
    for (const { name, re } of SECRET_PATTERNS) {
      const match = content.match(re);
      if (match) {
        found++;
        // Không in secret đầy đủ ra log — chỉ 12 ký tự đầu
        console.error(`❌ ${name} trong ${file}: ${match[0].slice(0, 12)}…`);
      }
    }
  }
} catch (err) {
  console.error(`Không quét được "${TARGET}":`, err.message);
  process.exit(2);
}

if (found > 0) {
  console.error(`\n⛔ Phát hiện ${found} secret trong ${TARGET}/ — KHÔNG được phát hành bản build này.`);
  console.error('   Gỡ VITE_OPENAI_API_KEY khỏi .env (key thuộc về server/.env) rồi build lại.');
  process.exit(1);
}

console.log(`✅ Không phát hiện secret (${scanned} file đã quét trong ${TARGET}/).`);
