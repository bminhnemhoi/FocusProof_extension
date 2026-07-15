/**
 * FocusProof – Đóng gói bản nộp Chrome Web Store
 * build → quét secret → nén dist/ thành focusproof-v<version>.zip
 *
 * Dùng: npm run package
 * Bản zip LUÔN được tạo lại từ dist mới nhất — không bao giờ nộp zip cũ.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

// 1. Build sạch
run('npm run build');

// 2. Chặn lộ secret vào bundle
run('node scripts/check-no-secrets.mjs dist');

// 3. Nén dist/ với tên theo version trong manifest
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const zipName = `focusproof-v${manifest.version}.zip`;
const zipPath = join(ROOT, zipName);

if (existsSync(zipPath)) rmSync(zipPath);

if (process.platform === 'win32') {
  // Nén NỘI DUNG dist (manifest.json phải nằm ở gốc zip theo yêu cầu Web Store)
  run(`powershell -NoProfile -Command "Compress-Archive -Path 'dist\\*' -DestinationPath '${zipName}' -Force"`);
} else {
  run(`cd dist && zip -qr ../${zipName} .`);
}

console.log(`\n✅ Đã tạo ${zipName} — sẵn sàng upload lên Chrome Web Store Dashboard.`);
