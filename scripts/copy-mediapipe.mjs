/**
 * FocusProof – Postinstall Script
 * Copy MediaPipe WASM và model files từ node_modules vào public/
 * Chạy tự động sau npm install.
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const wasmDir = resolve(root, 'public/wasm');
const modelsDir = resolve(root, 'public/models');

// Đảm bảo thư mục tồn tại
if (!existsSync(wasmDir)) mkdirSync(wasmDir, { recursive: true });
if (!existsSync(modelsDir)) mkdirSync(modelsDir, { recursive: true });

// Copy WASM files
const wasmSource = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const wasmFiles = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

for (const file of wasmFiles) {
  const src = resolve(wasmSource, file);
  const dest = resolve(wasmDir, file);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
  } else {
    console.warn(`  ⚠ Missing: ${file}`);
  }
}

// Model file cần download riêng (không có trong npm package)
const modelFile = resolve(modelsDir, 'blaze_face_short_range.tflite');
if (existsSync(modelFile)) {
  console.log('  ✓ Model blaze_face_short_range.tflite already exists');
} else {
  console.warn('  ⚠ Model file missing. Run:');
  console.warn('    curl -o public/models/blaze_face_short_range.tflite https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite');
}

console.log('[FocusProof] MediaPipe files setup complete.');
