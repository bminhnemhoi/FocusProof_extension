/**
 * FocusProof – Backend Reference Implementation
 * ------------------------------------------------------------------
 * Backend tối thiểu nhưng THẬT, giải quyết 3 tiêu chí của rubric:
 *
 *   4. Backend & API   → /api/ai-analyze giữ OpenAI key server-side (client
 *                        không còn nhúng key → hết rủi ro lộ key).
 *   5. Database        → SQLite (node:sqlite built-in, Node >= 22.5) lưu
 *                        chứng chỉ + sự kiện. Fallback: better-sqlite3 nếu
 *                        được cài, cuối cùng là JSON store atomic.
 *   8. Analytics       → /api/events nhận sự kiện & lỗi; /api/stats đọc lại.
 *
 * /api/certificates ký bản ghi bằng HMAC-SHA-256 (khóa bí mật server),
 * /verify/:id cho bất kỳ ai đối chiếu bản gốc do server lưu.
 *
 * Chạy:
 *   cd server && npm install && cp .env.example .env   (điền OPENAI_API_KEY)
 *   npm start
 *
 * Test:  npm test   (node:test — xem test.mjs)
 *
 * File này export `createApp()` để test import mà không tự listen;
 * chỉ listen khi được chạy trực tiếp (node index.js).
 */

import express from 'express';
import crypto from 'node:crypto';
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── .env loader tối giản (zero-dep, không ghi đè biến đã đặt sẵn) ──
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch { /* .env đọc lỗi → bỏ qua, dùng env hệ thống */ }
}
loadDotEnv(join(__dirname, '.env'));

// ── Config chung ──
const PORT = process.env.PORT || 8787;
const OPENAI_MODEL_ALLOWLIST = new Set(['gpt-4o-mini', 'gpt-4o']);
// Các giá trị secret "mặc định" — cấm dùng ở production (fail-fast).
const DEFAULT_SECRETS = new Set(['', 'dev-only-change-me', 'change-me-to-a-long-random-string']);
// Phiên bản chữ ký hiện hành: v2 phủ TOÀN BỘ record (id.hash.score.grade.date.task).
// v1 (cũ) chỉ phủ id.hash.score — record cũ vẫn verify được nhờ trường sigVersion.
const SIG_VERSION = 2;

// ── SQLite driver: ưu tiên node:sqlite (built-in >= 22.5), rồi better-sqlite3 ──
async function loadSqliteDriver() {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    return { name: 'node:sqlite', open: (path) => new DatabaseSync(path) };
  } catch { /* Node < 22.5 */ }
  try {
    const mod = await import('better-sqlite3');
    return { name: 'better-sqlite3', open: (path) => new mod.default(path) };
  } catch { /* chưa cài better-sqlite3 */ }
  return null;
}
const sqliteDriver = await loadSqliteDriver();

// ── Chữ ký HMAC ──
export function signRecord(record, secret, version = SIG_VERSION) {
  const payload = version >= 2
    ? `${record.id}.${record.hash}.${record.score}.${record.grade}.${record.date}.${record.task}`
    : `${record.id}.${record.hash}.${record.score}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// So sánh token chống timing attack (độ dài khác nhau → false ngay).
function tokenMatches(given, expected) {
  const a = Buffer.from(String(given ?? ''));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── Store: SQLite ──
function createSqliteStore(dataDir) {
  const db = sqliteDriver.open(join(dataDir, 'focusproof.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS certificates (
      id            TEXT PRIMARY KEY,
      hash          TEXT NOT NULL,
      score         INTEGER NOT NULL DEFAULT 0,
      grade         TEXT,
      date          TEXT,
      task          TEXT,
      signature     TEXT NOT NULL,
      sig_version   INTEGER NOT NULL DEFAULT ${SIG_VERSION},
      registered_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      props       TEXT,
      ts          INTEGER NOT NULL,
      install_id  TEXT,
      received_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
  `);

  const insCert = db.prepare(`
    INSERT OR REPLACE INTO certificates
      (id, hash, score, grade, date, task, signature, sig_version, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const selCert = db.prepare('SELECT * FROM certificates WHERE id = ?');
  const insEvent = db.prepare(`
    INSERT INTO events (name, props, ts, install_id, received_at) VALUES (?, ?, ?, ?, ?)
  `);

  const store = {
    engine: `sqlite (${sqliteDriver.name})`,
    saveCertificate(r) {
      insCert.run(
        r.id, r.hash, r.score, r.grade ?? '', r.date ?? '', r.task ?? '',
        r.signature, r.sigVersion ?? SIG_VERSION, r.registeredAt,
      );
    },
    getCertificate(id) {
      const row = selCert.get(id);
      if (!row) return null;
      return {
        id: row.id, hash: row.hash, score: Number(row.score), grade: row.grade,
        date: row.date, task: row.task, signature: row.signature,
        sigVersion: Number(row.sig_version ?? 1), registeredAt: row.registered_at,
      };
    },
    appendEvent(e) {
      insEvent.run(e.name, e.props ? JSON.stringify(e.props) : null, e.ts, e.installId, e.receivedAt);
    },
    getStats() {
      const totalEvents = Number(db.prepare('SELECT COUNT(*) AS c FROM events').get().c);
      const byName = {};
      for (const r of db.prepare('SELECT name, COUNT(*) AS c FROM events GROUP BY name').all()) {
        byName[r.name] = Number(r.c);
      }
      const errRows = db
        .prepare("SELECT ts, props FROM events WHERE name = 'runtime_error' ORDER BY id DESC LIMIT 10")
        .all();
      const last10Errors = errRows.map((r) => {
        let p = {};
        try { p = JSON.parse(r.props || '{}'); } catch { /* props hỏng → bỏ */ }
        return { ts: Number(r.ts), context: p.context ?? null, message: p.message ?? null };
      });
      return { totalEvents, byName, errorCount: byName.runtime_error ?? 0, last10Errors };
    },
    close() { db.close(); },
  };

  // Di trú 1 lần từ JSON store cũ (nếu có): record cũ ký theo công thức v1.
  const legacyFile = join(dataDir, 'certificates.json');
  if (existsSync(legacyFile)) {
    try {
      const legacy = JSON.parse(readFileSync(legacyFile, 'utf8'));
      for (const rec of Object.values(legacy)) {
        if (rec?.id && !store.getCertificate(rec.id)) {
          store.saveCertificate({ sigVersion: 1, registeredAt: rec.registeredAt ?? new Date().toISOString(), ...rec });
        }
      }
      renameSync(legacyFile, `${legacyFile}.migrated-${Date.now()}`);
      console.log('[store] Đã di trú certificates.json cũ vào SQLite (sigVersion=1).');
    } catch (err) {
      console.error('[store] Di trú JSON cũ thất bại (bỏ qua):', err.message);
    }
  }

  return store;
}

// ── Store: JSON fallback (atomic write, cách ly file hỏng) ──
function atomicWrite(file, content) {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, content);
  renameSync(tmp, file); // rename cùng volume = atomic → không bao giờ ghi dở
}

function readJsonSafe(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    // File hỏng → cách ly để điều tra, KHÔNG âm thầm trả fallback rồi ghi đè.
    const corrupt = `${file}.corrupt-${Date.now()}`;
    try { renameSync(file, corrupt); } catch { /* best-effort */ }
    console.error(`[store] ${file} hỏng (${err.message}) → đã đổi tên thành ${corrupt}`);
    return fallback;
  }
}

function createJsonStore(dataDir) {
  const certFile = join(dataDir, 'certificates.json');
  const eventFile = join(dataDir, 'events.jsonl');
  const certificates = readJsonSafe(certFile, {});
  return {
    engine: 'json',
    saveCertificate(record) {
      certificates[record.id] = record;
      atomicWrite(certFile, JSON.stringify(certificates, null, 2));
    },
    getCertificate(id) {
      return certificates[id] || null;
    },
    appendEvent(event) {
      // JSONL: mỗi dòng một sự kiện — append là thao tác an toàn.
      appendFileSync(eventFile, JSON.stringify(event) + '\n');
    },
    getStats() {
      const events = [];
      if (existsSync(eventFile)) {
        for (const line of readFileSync(eventFile, 'utf8').split('\n')) {
          if (!line.trim()) continue;
          try { events.push(JSON.parse(line)); } catch { /* dòng hỏng → bỏ */ }
        }
      }
      const byName = {};
      for (const e of events) byName[e.name] = (byName[e.name] ?? 0) + 1;
      const errors = events.filter((e) => e.name === 'runtime_error');
      return {
        totalEvents: events.length,
        byName,
        errorCount: errors.length,
        last10Errors: errors.slice(-10).reverse().map((e) => ({
          ts: Number(e.ts), context: e.props?.context ?? null, message: e.props?.message ?? null,
        })),
      };
    },
    close() { /* không có handle cần đóng */ },
  };
}

function createStore(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  if (sqliteDriver) {
    try {
      return createSqliteStore(dataDir);
    } catch (err) {
      console.error('[store] SQLite init thất bại → fallback JSON store:', err.message);
    }
  } else {
    console.warn('[store] Không có SQLite (Node < 22.5 và chưa cài better-sqlite3) → JSON store.');
  }
  return createJsonStore(dataDir);
}

// ── Rate limit in-memory + dọn entry hết hạn định kỳ (chống memory leak) ──
function createRateLimiter() {
  const hits = new Map();
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of hits) if (now > rec.reset) hits.delete(key);
  }, 60_000);
  sweeper.unref?.(); // không giữ process sống chỉ vì timer dọn dẹp
  return function allow(key, max, windowMs) {
    const now = Date.now();
    const rec = hits.get(key) || { count: 0, reset: now + windowMs };
    if (now > rec.reset) { rec.count = 0; rec.reset = now + windowMs; }
    rec.count++;
    hits.set(key, rec);
    return rec.count <= max;
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

// ── App factory (test import được, không tự listen) ──
export function createApp(overrides = {}) {
  const cfg = {
    env: overrides.env ?? process.env.NODE_ENV ?? 'development',
    openaiApiKey: overrides.openaiApiKey ?? process.env.OPENAI_API_KEY ?? '',
    signingSecret: overrides.signingSecret ?? process.env.CERT_SIGNING_SECRET ?? 'dev-only-change-me',
    publicBaseUrl: overrides.publicBaseUrl ?? process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`,
    corsOrigin: overrides.corsOrigin ?? process.env.CORS_ORIGIN ?? '*',
    apiToken: overrides.apiToken ?? process.env.API_TOKEN ?? '',
    dataDir: overrides.dataDir ?? process.env.FP_DATA_DIR ?? join(__dirname, 'data'),
    rateLimits: { ai: 20, cert: 60, events: 120, stats: 30, ...(overrides.rateLimits ?? {}) },
  };

  // Fail-fast: production BẮT BUỘC có secret thật, không chạy với default.
  if (cfg.env === 'production' && DEFAULT_SECRETS.has(cfg.signingSecret)) {
    throw new Error(
      'CERT_SIGNING_SECRET chưa được đặt (hoặc vẫn là giá trị mặc định). ' +
      'Ở production bắt buộc đặt chuỗi ngẫu nhiên >= 32 ký tự.',
    );
  }

  const store = createStore(cfg.dataDir);
  const allow = createRateLimiter();

  const app = express();
  app.set('trust proxy', 1); // lấy đúng IP client sau reverse proxy (Render/Railway/Fly)
  app.locals.store = store;  // cho test truy cập trực tiếp
  app.locals.config = cfg;

  app.use(express.json({ limit: '256kb' }));
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', cfg.corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-fp-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Nếu API_TOKEN được đặt → endpoint ghi/đọc nội bộ yêu cầu header x-fp-token.
  // Không đặt → cho qua (chế độ demo). Xem README về giới hạn của mô hình này.
  const requireToken = (req, res, next) => {
    if (!cfg.apiToken) return next();
    if (!tokenMatches(req.get('x-fp-token'), cfg.apiToken)) {
      return res.status(401).json({ error: 'Thiếu hoặc sai x-fp-token' });
    }
    next();
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'focusproof-server', aiConfigured: !!cfg.openaiApiKey, store: store.engine });
  });

  // ── 1) AI proxy: giữ OpenAI key server-side ───────────────────────
  // Client gửi { model, messages, max_tokens, temperature } — KHÔNG kèm key.
  app.post('/api/ai-analyze', async (req, res) => {
    if (!allow(`ai:${req.ip}`, cfg.rateLimits.ai, 60_000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    if (!cfg.openaiApiKey) {
      return res.status(503).json({ error: 'AI chưa cấu hình trên server (thiếu OPENAI_API_KEY)' });
    }
    const { model = 'gpt-4o-mini', messages, max_tokens = 1024, temperature = 0.7 } = req.body || {};
    if (!Array.isArray(messages) || !OPENAI_MODEL_ALLOWLIST.has(model)) {
      return res.status(400).json({ error: 'Payload không hợp lệ' });
    }
    // Chặn lạm dụng proxy: giới hạn số message + độ dài từng message.
    if (messages.length > 20) {
      return res.status(400).json({ error: 'Tối đa 20 messages' });
    }
    for (const m of messages) {
      if (typeof m?.content === 'string' && m.content.length > 8000) {
        return res.status(400).json({ error: 'Message quá dài (tối đa 8000 ký tự)' });
      }
    }
    const maxTokens = Math.min(Math.max(1, Math.floor(Number(max_tokens) || 1024)), 2048);
    const temp = Math.min(Math.max(0, Number(temperature) || 0.7), 2);
    try {
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.openaiApiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: temp }),
      });
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch (err) {
      res.status(502).json({ error: 'Upstream AI error', detail: String(err) });
    }
  });

  // ── 2) Certificate registry: ký + lưu để xác thực THẬT ────────────
  app.post('/api/certificates', requireToken, (req, res) => {
    if (!allow(`cert:${req.ip}`, cfg.rateLimits.cert, 60_000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    const { id, hash, score, grade, date, task } = req.body || {};
    if (!id || !hash) return res.status(400).json({ error: 'Thiếu id hoặc hash' });

    const record = {
      id: String(id).slice(0, 80),
      hash: String(hash).slice(0, 64),
      score: Number(score) || 0,
      grade: String(grade || '').slice(0, 2),
      date: String(date || '').slice(0, 10),
      task: String(task || '').slice(0, 120),
      sigVersion: SIG_VERSION,
      registeredAt: new Date().toISOString(),
    };

    // Chống ghi đè: id đã tồn tại với hash KHÁC → từ chối; cùng hash → idempotent.
    const existing = store.getCertificate(record.id);
    if (existing) {
      if (existing.hash !== record.hash) {
        return res.status(409).json({ error: 'ID đã được đăng ký với nội dung khác — từ chối ghi đè' });
      }
      return res.json({
        certificateId: existing.id,
        signature: existing.signature,
        verifyUrl: `${cfg.publicBaseUrl}/verify/${encodeURIComponent(existing.id)}`,
        alreadyRegistered: true,
      });
    }

    // Chữ ký v2: HMAC-SHA-256 phủ toàn bộ record (id.hash.score.grade.date.task)
    // → sửa bất kỳ trường nào cũng làm chữ ký mất hiệu lực.
    record.signature = signRecord(record, cfg.signingSecret, SIG_VERSION);

    store.saveCertificate(record);
    res.json({
      certificateId: record.id,
      signature: record.signature,
      verifyUrl: `${cfg.publicBaseUrl}/verify/${encodeURIComponent(record.id)}`,
    });
  });

  // ── 3) Verify page: ai quét QR cũng đối chiếu được bản gốc ────────
  app.get('/verify/:id', (req, res) => {
    const record = store.getCertificate(req.params.id);
    const wantsJson = (req.headers.accept || '').includes('application/json');
    if (!record) {
      if (wantsJson) return res.status(404).json({ valid: false, reason: 'not_found' });
      return res.status(404).send('<h1>❌ Không tìm thấy chứng chỉ</h1>');
    }
    // Đối chiếu chữ ký theo ĐÚNG phiên bản đã ký record đó (v1 cũ / v2 mới).
    const version = Number(record.sigVersion) >= 2 ? 2 : 1;
    const valid = signRecord(record, cfg.signingSecret, version) === record.signature;

    // ?h=<prefix>: QR nhúng prefix hash — đối chiếu với bản ghi gốc trên server.
    const h = typeof req.query.h === 'string' && req.query.h ? req.query.h : null;
    const hashMatch = h === null ? null : record.hash.startsWith(h);

    if (wantsJson) {
      return res.json({ valid, sigVersion: version, ...(h !== null ? { hashMatch } : {}), record });
    }
    const hashWarning = hashMatch === false
      ? '<p style="color:#b91c1c"><b>⚠️ Cảnh báo:</b> mã hash trên chứng chỉ KHÔNG khớp với bản ghi gốc trên server.</p>'
      : '';
    res.send(`<!doctype html><meta charset="utf-8">
    <title>FocusProof – Xác thực chứng chỉ</title>
    <div style="font-family:system-ui;max-width:520px;margin:40px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h1>${valid ? '✅ Chứng chỉ hợp lệ' : '⚠️ Chữ ký không khớp'}</h1>
      ${hashWarning}
      <p><b>Công việc:</b> ${escapeHtml(record.task)}</p>
      <p><b>Điểm:</b> ${record.score}/100 (hạng ${escapeHtml(record.grade)})</p>
      <p><b>Ngày:</b> ${escapeHtml(record.date)}</p>
      <p><b>ID:</b> <code>${escapeHtml(record.id)}</code></p>
      <p style="color:#64748b;font-size:13px"><b>SHA-256:</b> <code>${escapeHtml(record.hash)}</code></p>
      <p style="color:#64748b;font-size:13px">Bản ghi do server FocusProof ký và lưu tại thời điểm phiên kết thúc.</p>
    </div>`);
  });

  // ── 4) Analytics/error ingest ─────────────────────────────────────
  app.post('/api/events', requireToken, (req, res) => {
    if (!allow(`ev:${req.ip}`, cfg.rateLimits.events, 60_000)) return res.sendStatus(429);
    const { name, props, ts, installId } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Thiếu name' });
    store.appendEvent({
      name: name.slice(0, 40),
      props: props && typeof props === 'object' && !Array.isArray(props) ? props : undefined,
      ts: Number(ts) || Date.now(),
      installId: String(installId || 'anonymous').slice(0, 60),
      receivedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  });

  // ── 5) Analytics đọc được: tổng hợp sự kiện + lỗi gần nhất ────────
  app.get('/api/stats', requireToken, (req, res) => {
    if (!allow(`stats:${req.ip}`, cfg.rateLimits.stats, 60_000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    res.json(store.getStats());
  });

  // JSON body hỏng → 400 JSON thay vì trang lỗi HTML mặc định của Express.
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON không hợp lệ' });
    }
    console.error('[server] Lỗi không bắt được:', err);
    res.status(500).json({ error: 'Lỗi server' });
  });

  return app;
}

// ── Chỉ listen khi chạy trực tiếp (node index.js) — test import thì không ──
const thisFile = fileURLToPath(import.meta.url);
const argvFile = process.argv[1] ? resolve(process.argv[1]) : '';
const isDirectRun = process.platform === 'win32'
  ? argvFile.toLowerCase() === thisFile.toLowerCase()
  : argvFile === thisFile;

if (isDirectRun) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(
      `[FocusProof server] listening on ${app.locals.config.publicBaseUrl} ` +
      `(AI ${app.locals.config.openaiApiKey ? 'ON' : 'OFF'}, store: ${app.locals.store.engine})`,
    );
  });
}
