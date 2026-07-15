/**
 * FocusProof server – test suite (node:test + fetch, không cần dependency).
 * Mỗi test tạo app riêng với dataDir tạm → cách ly hoàn toàn với data/ thật.
 * Chạy: npm test  (= node --test test.mjs)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, signRecord } from './index.js';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

/** Tạo app + listen port ngẫu nhiên; tự dọn dẹp khi test kết thúc. */
function makeApp(t, overrides = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'fp-test-'));
  const app = createApp({ dataDir, signingSecret: SECRET, ...overrides });
  return new Promise((resolveListen) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      t.after(async () => {
        await new Promise((r) => server.close(r));
        app.locals.store.close?.();
        try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* Windows file lock */ }
      });
      resolveListen({ app, base, store: app.locals.store });
    });
  });
}

function post(base, path, body, headers = {}) {
  return fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function verifyJson(base, id, query = '') {
  return fetch(`${base}/verify/${encodeURIComponent(id)}${query}`, {
    headers: { Accept: 'application/json' },
  });
}

const CERT = {
  id: 'fp_test_1',
  hash: 'a'.repeat(64),
  score: 87,
  grade: 'A',
  date: '2026-07-11',
  task: 'Viết báo cáo cuối kỳ',
};

test('health: trả ok + engine store', async (t) => {
  const { base, store } = await makeApp(t);
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.store, store.engine);
});

test('đăng ký → verify roundtrip: chữ ký v2 phủ toàn bộ record', async (t) => {
  const { base } = await makeApp(t);

  const reg = await post(base, '/api/certificates', CERT);
  assert.equal(reg.status, 200);
  const regBody = await reg.json();
  assert.equal(regBody.certificateId, CERT.id);
  assert.ok(regBody.verifyUrl.includes(`/verify/${CERT.id}`));
  // Chữ ký đúng công thức v2: id.hash.score.grade.date.task
  assert.equal(regBody.signature, signRecord(CERT, SECRET, 2));

  const ver = await verifyJson(base, CERT.id);
  assert.equal(ver.status, 200);
  const verBody = await ver.json();
  assert.equal(verBody.valid, true);
  assert.equal(verBody.record.sigVersion, 2);
  assert.equal(verBody.record.score, CERT.score);
  assert.equal(verBody.record.task, CERT.task);

  // ?h= đúng prefix → hashMatch true; sai prefix → false (cảnh báo)
  const ok = await (await verifyJson(base, CERT.id, `?h=${CERT.hash.slice(0, 16)}`)).json();
  assert.equal(ok.hashMatch, true);
  const bad = await (await verifyJson(base, CERT.id, '?h=deadbeef')).json();
  assert.equal(bad.hashMatch, false);

  // Verify id không tồn tại → 404
  const notFound = await verifyJson(base, 'khong-ton-tai');
  assert.equal(notFound.status, 404);
});

test('sửa record trong DB → verify trả valid=false', async (t) => {
  const { base, store } = await makeApp(t);
  await post(base, '/api/certificates', CERT);

  // Giả lập kẻ tấn công sửa điểm trực tiếp trong DB (giữ nguyên chữ ký cũ)
  const rec = store.getCertificate(CERT.id);
  store.saveCertificate({ ...rec, score: 100 });

  const verBody = await (await verifyJson(base, CERT.id)).json();
  assert.equal(verBody.valid, false);
});

test('chữ ký v2 phủ cả grade/date/task (điểm yếu v1 đã vá)', async (t) => {
  const { base, store } = await makeApp(t);
  await post(base, '/api/certificates', CERT);

  // Với v1, sửa grade không làm hỏng chữ ký. Với v2 thì PHẢI hỏng.
  const rec = store.getCertificate(CERT.id);
  store.saveCertificate({ ...rec, grade: 'S' });
  const verBody = await (await verifyJson(base, CERT.id)).json();
  assert.equal(verBody.valid, false);
});

test('tương thích ngược: record cũ sigVersion=1 vẫn verify đúng công thức v1', async (t) => {
  const { base, store } = await makeApp(t);
  const legacy = {
    id: 'fp_legacy_1', hash: 'b'.repeat(64), score: 55, grade: 'C',
    date: '2025-12-01', task: 'Ôn thi', sigVersion: 1,
    registeredAt: new Date().toISOString(),
  };
  legacy.signature = signRecord(legacy, SECRET, 1); // ký kiểu cũ: id.hash.score
  store.saveCertificate(legacy);

  const verBody = await (await verifyJson(base, legacy.id)).json();
  assert.equal(verBody.valid, true);
  assert.equal(verBody.sigVersion, 1);
});

test('chống ghi đè: 409 khi id trùng + hash khác; idempotent khi trùng cả hai', async (t) => {
  const { base } = await makeApp(t);

  const first = await post(base, '/api/certificates', CERT);
  assert.equal(first.status, 200);
  const firstBody = await first.json();

  // Cùng id, hash KHÁC → từ chối ghi đè
  const conflict = await post(base, '/api/certificates', { ...CERT, hash: 'f'.repeat(64), score: 100 });
  assert.equal(conflict.status, 409);

  // Cùng id, cùng hash → idempotent, trả lại đúng chữ ký cũ
  const again = await post(base, '/api/certificates', CERT);
  assert.equal(again.status, 200);
  const againBody = await again.json();
  assert.equal(againBody.signature, firstBody.signature);
  assert.equal(againBody.alreadyRegistered, true);

  // Record gốc không bị thay đổi
  const verBody = await (await verifyJson(base, CERT.id)).json();
  assert.equal(verBody.valid, true);
  assert.equal(verBody.record.score, CERT.score);
});

test('rate limit: vượt ngưỡng trả 429', async (t) => {
  const { base } = await makeApp(t, { rateLimits: { cert: 3 } });
  for (let i = 1; i <= 3; i++) {
    const res = await post(base, '/api/certificates', { ...CERT, id: `fp_rl_${i}` });
    assert.equal(res.status, 200, `request ${i} phải qua`);
  }
  const blocked = await post(base, '/api/certificates', { ...CERT, id: 'fp_rl_4' });
  assert.equal(blocked.status, 429);
});

test('/api/events: validate name, nhận props hợp lệ', async (t) => {
  const { base } = await makeApp(t);

  const missing = await post(base, '/api/events', { props: { a: 1 } });
  assert.equal(missing.status, 400);

  const ok = await post(base, '/api/events', {
    name: 'session_completed', props: { score: 87 }, ts: Date.now(), installId: 'test-install',
  });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).ok, true);
});

test('/api/stats: tổng hợp sự kiện + 10 lỗi gần nhất từ DB', async (t) => {
  const { base } = await makeApp(t);

  await post(base, '/api/events', { name: 'session_completed', props: { score: 80 } });
  await post(base, '/api/events', { name: 'session_completed', props: { score: 90 } });
  await post(base, '/api/events', {
    name: 'runtime_error', props: { context: 'popup', message: 'boom' }, ts: 1234567890,
  });

  const stats = await (await fetch(`${base}/api/stats`)).json();
  assert.equal(stats.totalEvents, 3);
  assert.equal(stats.byName.session_completed, 2);
  assert.equal(stats.byName.runtime_error, 1);
  assert.equal(stats.errorCount, 1);
  assert.equal(stats.last10Errors.length, 1);
  assert.deepEqual(stats.last10Errors[0], { ts: 1234567890, context: 'popup', message: 'boom' });
});

test('API_TOKEN đặt → POST/stats yêu cầu x-fp-token; không đặt → cho qua', async (t) => {
  const { base } = await makeApp(t, { apiToken: 'sekret-token' });

  const noToken = await post(base, '/api/events', { name: 'x' });
  assert.equal(noToken.status, 401);
  const wrongToken = await post(base, '/api/events', { name: 'x' }, { 'x-fp-token': 'sai' });
  assert.equal(wrongToken.status, 401);
  const okToken = await post(base, '/api/events', { name: 'x' }, { 'x-fp-token': 'sekret-token' });
  assert.equal(okToken.status, 200);

  const statsNoToken = await fetch(`${base}/api/stats`);
  assert.equal(statsNoToken.status, 401);
  const statsOk = await fetch(`${base}/api/stats`, { headers: { 'x-fp-token': 'sekret-token' } });
  assert.equal(statsOk.status, 200);

  // /api/health và /verify vẫn công khai
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

test('/api/ai-analyze: validate payload (không gọi upstream khi payload sai)', async (t) => {
  const { base } = await makeApp(t, { openaiApiKey: 'test-key-khong-goi-that' });

  // Quá 20 messages → 400
  const tooMany = await post(base, '/api/ai-analyze', {
    messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'hi' })),
  });
  assert.equal(tooMany.status, 400);

  // Message quá 8000 ký tự → 400
  const tooLong = await post(base, '/api/ai-analyze', {
    messages: [{ role: 'user', content: 'x'.repeat(8001) }],
  });
  assert.equal(tooLong.status, 400);

  // Model ngoài allowlist → 400
  const badModel = await post(base, '/api/ai-analyze', {
    model: 'gpt-5-turbo-max', messages: [{ role: 'user', content: 'hi' }],
  });
  assert.equal(badModel.status, 400);
});

test('/api/ai-analyze: 503 khi chưa cấu hình OPENAI_API_KEY', async (t) => {
  const { base } = await makeApp(t, { openaiApiKey: '' });
  const res = await post(base, '/api/ai-analyze', { messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(res.status, 503);
});

test('fail-fast: production + secret mặc định → createApp throw', () => {
  assert.throws(
    () => createApp({ env: 'production', signingSecret: 'dev-only-change-me' }),
    /CERT_SIGNING_SECRET/,
  );
  // Có secret thật → không throw
  const dataDir = mkdtempSync(join(tmpdir(), 'fp-test-prod-'));
  const app = createApp({ env: 'production', signingSecret: crypto.randomBytes(32).toString('hex'), dataDir });
  app.locals.store.close?.();
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* ignore */ }
});
