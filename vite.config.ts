import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import { resolve } from 'path';
import { existsSync, rmSync, statSync } from 'fs';

/**
 * MV3 compliance: neutralize remote-hosted code URLs that ship inside
 * the bundled jsPDF library. jsPDF's unused `pdfobjectnewwindow` /
 * `pdfjsnewwindow` output modes (plus MD5/PDFKit attribution comments)
 * hardcode external .js URLs. FocusProof ONLY calls `doc.output('blob')`
 * (src/utils/certificate.ts), so these code paths are dead.
 *
 * We replace only the 3 EXACT known URLs (targeted, not a broad sweep)
 * so there is zero risk of touching any legitimate string. This removes
 * the Chrome Web Store "Remotely hosted code" rejection (ref: Blue Argon).
 */
function stripRemoteHostedCode() {
  // Only these 3 exact strings — all live inside node_modules/jspdf.
  const KNOWN_REMOTE_CODE: RegExp[] = [
    /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdfobject\/[\d.]+\/pdfobject\.min\.js/g,
    /http:\/\/www\.myersdaily\.org\/joseph\/javascript\/md5\.js/g,
    /https:\/\/github\.com\/foliojs\/pdfkit\/blob\/master\/lib\/security\.js/g,
  ];
  return {
    name: 'strip-remote-hosted-code',
    apply: 'build' as const,
    renderChunk(code: string) {
      let changed = false;
      let out = code;
      for (const re of KNOWN_REMOTE_CODE) {
        re.lastIndex = 0;
        if (re.test(out)) {
          re.lastIndex = 0;
          out = out.replace(re, 'about:blank');
          changed = true;
        }
      }
      return changed ? { code: out, map: null } : null;
    },
  };
}

/**
 * Dọn tài sản trùng lặp trong dist (tiết kiệm ~20MB / gói build).
 *
 * MediaPipe WASM/model + fonts nằm trong `public/`, nên bị copy 2 nơi:
 *   - Vite publicDir  → dist/wasm, dist/models, dist/fonts   (KHÔNG dùng)
 *   - @crxjs (web_accessible_resources) → dist/public/wasm…  (ĐANG dùng)
 * Runtime chỉ tham chiếu `chrome.runtime.getURL('public/…')`
 * (offscreen.ts, certificate.ts) → bản root dư thừa. Xóa an toàn.
 *
 * Chỉ xóa nếu bản trong dist/public/ tồn tại (chốt chặn: đúng bản trùng).
 * Các file diagnostic (dist/camera-diagnostic.html…) KHÔNG bị đụng.
 */
function pruneDuplicatePublicAssets() {
  const DUP_DIRS = ['wasm', 'models', 'fonts'];
  return {
    name: 'prune-duplicate-public-assets',
    apply: 'build' as const,
    closeBundle() {
      const out = resolve(__dirname, 'dist');
      for (const dir of DUP_DIRS) {
        const rootCopy = resolve(out, dir);
        const canonical = resolve(out, 'public', dir);
        const isDupe =
          existsSync(rootCopy) &&
          existsSync(canonical) &&
          statSync(rootCopy).isDirectory();
        if (isDupe) {
          rmSync(rootCopy, { recursive: true, force: true });
          // eslint-disable-next-line no-console
          console.log(`[prune] removed duplicate dist/${dir} (kept dist/public/${dir})`);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    stripRemoteHostedCode(),
    pruneDuplicatePublicAssets(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
