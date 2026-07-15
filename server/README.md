# FocusProof – Backend (reference implementation)

Backend tối thiểu nhưng **thật**, biến 3 điểm yếu của bản MVP thành điểm mạnh:

| Tiêu chí rubric | Endpoint | Vai trò |
|---|---|---|
| **4. Backend & API** | `POST /api/ai-analyze` | Giữ OpenAI key **server-side** → extension không còn nhúng key, hết rủi ro lộ key. |
| **5. Database** | `POST /api/certificates`, `GET /verify/:id` | Lưu vào **SQLite** + **ký** bản ghi (HMAC-SHA-256 phủ toàn bộ record) → quét QR đối chiếu bản gốc thật. |
| **8. Analytics** | `POST /api/events`, `GET /api/stats` | Nhận sự kiện & lỗi runtime ẩn danh, đọc lại được qua API tổng hợp. |

## Lưu trữ

- **SQLite** qua module built-in `node:sqlite` (Node >= 22.5, zero dependency).
  File DB: `server/data/focusproof.db` (2 bảng `certificates`, `events`).
- Node cũ hơn: tự dùng `better-sqlite3` **nếu đã cài** (`npm i better-sqlite3`).
- Nếu SQLite không khả dụng → fallback JSON store **atomic** (ghi file tạm rồi
  rename; file hỏng được cách ly thành `.corrupt-<ts>` thay vì âm thầm mất data).
- Lần chạy SQLite đầu tiên sẽ **di trú** `data/certificates.json` cũ (nếu có)
  vào DB với `sigVersion=1` (chữ ký kiểu cũ vẫn verify đúng).

## Chạy local

```bash
cd server
npm install
cp .env.example .env         # điền OPENAI_API_KEY (tùy chọn) + CERT_SIGNING_SECRET
npm start                    # http://localhost:8787
npm test                     # node:test – toàn bộ test suite
```

Kiểm tra nhanh:

```bash
curl http://localhost:8787/api/health
curl http://localhost:8787/api/stats      # thêm -H "x-fp-token: <token>" nếu đặt API_TOKEN
```

## API

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/health` | Trạng thái + engine store đang dùng |
| POST | `/api/ai-analyze` | Proxy OpenAI. Giới hạn: model allowlist, ≤ 20 messages, mỗi content ≤ 8000 ký tự, `max_tokens` ≤ 2048 |
| POST | `/api/certificates` | Ký + lưu. **Idempotent** (cùng id + hash → trả bản cũ); id trùng nhưng hash khác → **409** |
| GET | `/verify/:id` | HTML hoặc JSON (header `Accept: application/json`). Query `?h=<prefix>` đối chiếu prefix hash trên QR với bản gốc — lệch sẽ hiện cảnh báo |
| POST | `/api/events` | Ingest sự kiện `{ name, props?, ts?, installId? }` |
| GET | `/api/stats` | `{ totalEvents, byName, errorCount, last10Errors }` |

Nếu đặt `API_TOKEN` trong env: `POST /api/certificates`, `POST /api/events` và
`GET /api/stats` yêu cầu header `x-fp-token` khớp. `/api/health` và `/verify/:id`
luôn công khai.

### Chữ ký chứng chỉ (sigVersion)

- **v2 (hiện hành)**: HMAC-SHA-256 trên `id.hash.score.grade.date.task` — sửa
  bất kỳ trường nào trong DB đều làm chữ ký mất hiệu lực.
- **v1 (cũ)**: chỉ phủ `id.hash.score`. Record cũ mang `sigVersion=1` và được
  verify theo đúng công thức cũ (tương thích ngược).

## Nối với extension

Trong `.env` của extension (thư mục gốc dự án), trỏ tới backend:

```
VITE_AI_PROXY_URL=http://localhost:8787/api/ai-analyze
VITE_ANALYTICS_URL=http://localhost:8787/api/events
VITE_VERIFY_BASE_URL=http://localhost:8787
```

Rồi build lại extension. Khi đó:
- Nút **Phân tích AI** gọi qua proxy (không cần key ở client).
- Mã **QR** trong chứng chỉ trỏ tới `…/verify/<id>?h=<hash-prefix>` — người chấm
  quét là ra bản gốc, server tự đối chiếu prefix hash.
- Sự kiện & lỗi được gửi ẩn danh về `/api/events`.

Nếu **không** cấu hình, extension vẫn chạy đầy đủ: AI dùng engine offline,
QR dùng payload tự chứng thực. Backend là **nâng cấp cộng thêm**, không phải
phụ thuộc cứng.

## Deploy

Yêu cầu chung: Node >= 22.5 (để có `node:sqlite`), và một **persistent disk**
mount vào `server/data/` — nếu không, DB sẽ mất mỗi lần redeploy.

Biến môi trường bắt buộc ở production:

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` (server **từ chối boot** nếu secret còn là default) |
| `CERT_SIGNING_SECRET` | chuỗi ngẫu nhiên >= 32 ký tự |
| `PUBLIC_BASE_URL` | URL công khai, vd `https://focusproof-api.onrender.com` |
| `CORS_ORIGIN` | `chrome-extension://<extension-id>` |
| `OPENAI_API_KEY` | (tùy chọn) bật AI proxy |
| `API_TOKEN` | (tùy chọn) bảo vệ endpoint ghi + stats |

### Render

1. New → **Web Service** → connect repo, đặt **Root Directory** = `server`.
2. Build command: `npm install` — Start command: `npm start`.
3. Environment → thêm các biến ở bảng trên.
4. **Disks** → Add Disk: mount path `/opt/render/project/src/server/data`,
   size 1 GB (SQLite rất nhẹ).
5. Deploy → thử `https://<app>.onrender.com/api/health`.

### Railway

1. New Project → Deploy from GitHub repo.
2. Settings → **Root Directory** = `server`; start command mặc định `npm start`.
3. Variables → thêm các biến ở bảng trên.
4. Thêm **Volume**, mount vào `/app/data`, và đặt biến `FP_DATA_DIR=/app/data`
   (server đọc biến này để trỏ thư mục data ra volume).

### Fly.io

```bash
cd server
fly launch --no-deploy              # sinh fly.toml, chọn region
fly volumes create fp_data --size 1
fly secrets set NODE_ENV=production CERT_SIGNING_SECRET=<random> PUBLIC_BASE_URL=https://<app>.fly.dev
```

Trong `fly.toml` thêm mount + trỏ data dir:

```toml
[mounts]
  source = "fp_data"
  destination = "/data"

[env]
  FP_DATA_DIR = "/data"
```

Rồi `fly deploy`.

## Giới hạn bảo mật còn lại (đọc trước khi tin)

- **`API_TOKEN` không phải authentication thật.** Token là chuỗi tĩnh dùng
  chung; nếu nhúng vào extension thì ai dịch ngược cũng lấy được. Nó chỉ nâng
  rào chống spam/abuse tự động, không thay được auth per-user (OAuth/JWT).
- **HMAC là chữ ký đối xứng**: ai chiếm được server (hoặc secret) thì ký được
  chứng chỉ giả. Muốn chống cả kịch bản đó cần chữ ký bất đối xứng (Ed25519)
  + công bố public key.
- Server chỉ chứng nhận "**bản ghi này được đăng ký tại thời điểm đó**" — không
  chứng minh được người dùng thực sự tập trung (client có thể gửi số liệu đẹp).
  Hash phiên làm giả mạo *về sau* khó, không ngăn gian lận *tại nguồn*.
- Rate limit in-memory: đủ cho 1 instance; chạy nhiều instance cần Redis.
- `/verify/:id` công khai theo thiết kế (để người chấm quét QR) → không đặt
  dữ liệu nhạy cảm vào `task`.
- Đã bật `trust proxy` (mức 1) để rate-limit đúng IP sau reverse proxy — nếu
  deploy KHÔNG qua proxy, có thể bỏ để tránh giả mạo `X-Forwarded-For`.
