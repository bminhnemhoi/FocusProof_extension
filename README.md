# FocusProof

**Chứng chỉ Tập trung Thông minh & Xác thực**

Chrome Extension (Manifest V3) giúp đo lường, ghi nhận và chứng minh mức độ tập trung trong các phiên làm việc/học tập.

## Tính năng chính

- **Face Detection** (MediaPipe BlazeFace, WASM local) — phát hiện mặt qua webcam, không lưu ảnh
- **Activity Tracking** — bàn phím IME tiếng Việt, chuột, cuộn trang, idle detection
- **Tab & Screen Tracking** — theo dõi domain/URL realtime, phát hiện rời Chrome
- **Goal-based Evaluation** — 4 chế độ (Study, Work, Programming, Video Lecture) + custom domains
- **Real-time Alert System** — face-lost, idle, tab-violation, outside-chrome (nhắc lại mỗi 30s)
- **Floating Widget** — Shadow DOM overlay, drag, minimize, realtime countdown 1s, touch support
- **Certificate PDF 2 trang** — watermark, QR code SHA-256, font tiếng Việt, phân tích AI
- **AI Analysis** — GPT-4o-mini phân tích song ngữ Việt-Anh (opt-in, 30s timeout)
- **Voice Note** — Web Speech API, tối đa 30s, tích hợp vào AI prompt
- **Gamification** — 10 huy hiệu (Bước Đầu Tiên, Bậc Thầy, Marathon, Cú Đêm...)
- **History** — heatmap 7 ngày, biểu đồ cột, lọc theo mode, export CSV
- **Chia sẻ** — nút chia sẻ Facebook/TikTok trên trang kết quả
- **Dark Theme** — 3 chế độ (system/light/dark), CSS variables
- **Camera-Off Mode** — chạy không camera, tự chỉnh trọng số
- **Multi-Tab Guard** — Strict Mode chỉ cho 1 tab, danh sách domain tùy chỉnh

## Tech Stack

- **Build**: Vite 5 + @crxjs/vite-plugin
- **UI**: React 19 + TypeScript (strict)
- **Face Detection**: @mediapipe/tasks-vision (BlazeFace, WASM local)
- **PDF**: jsPDF + html2canvas
- **QR**: qrcode
- **AI**: OpenAI GPT-4o-mini (opt-in)
- **Testing**: Vitest + jsdom + Chrome API mocks (184 tests, 11 files)
- **Lint**: ESLint + Prettier

## Cài đặt & Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd Extension_FocusProof
npm install
```

### 2. Cấu hình API Key (tùy chọn)

```bash
cp .env.example .env
```

Mở `.env` và thay `sk-your-api-key-here` bằng API key thật từ [OpenAI Platform](https://platform.openai.com/api-keys). Nếu không có key, app vẫn chạy bình thường — chỉ tính năng AI Analysis bị vô hiệu.

### 3. Build Extension

```bash
# Development (HMR)
npm run dev

# Production
npm run build
```

### 4. Load Extension trong Chrome

1. Mở `chrome://extensions/`
2. Bật **Developer mode** (góc trên phải)
3. Click **Load unpacked**
4. Chọn thư mục `dist/` trong project
5. Extension "FocusProof" xuất hiện trên toolbar

> **Lưu ý:** Sau mỗi lần `npm run build`, cần quay lại `chrome://extensions/` và nhấn nút reload (🔄) trên card FocusProof.

## Chạy Tests

```bash
# Chạy tất cả tests (184 tests)
npm test

# Chạy tests trong watch mode
npm run test:watch

# Type check (không emit)
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

## Cấu trúc Dự án

```
Extension_FocusProof/
├── public/
│   ├── icons/               PNG icons (16, 48, 128) + SVG
│   ├── fonts/               Roboto TTF (Regular, Bold, Italic)
│   ├── models/              MediaPipe BlazeFace (.tflite)
│   ├── wasm/                MediaPipe WASM runtime (SIMD + noSIMD)
│   ├── camera-diagnostic.*  Trang kiểm tra camera & micro
│   ├── alert-diagnostic.*   Trang kiểm tra alert
│   └── widget-diagnostic.*  Trang kiểm tra widget
├── src/
│   ├── background/
│   │   ├── index.ts         Message router, Chrome events, startup recovery
│   │   ├── session-manager.ts  Session lifecycle, sampling, hash, badges
│   │   ├── tab-tracker.ts   Tab/window state tracking
│   │   ├── goal-manager.ts  GoalConfig + TabResult builder
│   │   ├── alert-manager.ts Realtime alert state
│   │   └── offscreen-manager.ts  Offscreen document lifecycle
│   ├── content-script/
│   │   ├── index.ts         Activity tracking (IME-aware) + message handler
│   │   └── widget.ts        Shadow DOM floating widget + countdown + alerts
│   ├── offscreen/
│   │   ├── offscreen.ts     Camera + MediaPipe face detection (GPU→CPU fallback)
│   │   └── offscreen.html   Hidden video element
│   ├── popup/
│   │   ├── components/      7 React components
│   │   │   ├── StartScreen.tsx     Task, mode, duration, advanced settings
│   │   │   ├── CameraModal.tsx     Camera permission + preview
│   │   │   ├── RunningScreen.tsx   Live timer, score, alerts
│   │   │   ├── ResultScreen.tsx    Score, badges, AI, Voice Note, PDF, Share
│   │   │   ├── HistoryScreen.tsx   Heatmap, bar chart, filter, CSV
│   │   │   ├── DiagnosticDashboard.tsx  Camera + permission diagnostics
│   │   │   └── ErrorBoundary.tsx   React error boundary
│   │   ├── styles/          CSS per component + global dark theme
│   │   ├── App.tsx          Screen orchestrator
│   │   ├── main.tsx         Entry point
│   │   └── index.html       HTML entry
│   ├── utils/
│   │   ├── types.ts         Core types, constants, weights
│   │   ├── focus.ts         Score calculation & grading
│   │   ├── storage.ts       chrome.storage wrapper (100 session limit)
│   │   ├── alert-system.ts  4 alert types with 30s repeat
│   │   ├── goal-evaluator.ts  isGoalCompliant & isDomainAllowed
│   │   ├── gamification.ts  10 badges with criteria
│   │   ├── certificate.ts   2-page PDF (watermark, QR, fonts)
│   │   ├── ai-analysis.ts   GPT-4o-mini (30s timeout)
│   │   ├── qr-code.ts       QR with session hash
│   │   ├── voice-note.ts    Web Speech API (30s max)
│   │   └── api-key.ts       XOR obfuscation
│   └── __tests__/           11 test files, 184 tests
├── manifest.json            Chrome Extension Manifest V3
├── vite.config.ts           Vite + CRXJS config
├── vitest.config.ts         Test config
├── tsconfig.json            TypeScript strict config
├── eslint.config.js         ESLint flat config
└── package.json             Dependencies
```

## Quyền Extension

| Permission | Mục đích |
|-----------|----------|
| `tabs` | Theo dõi tab/domain đang active |
| `activeTab` | Truy cập tab hiện tại |
| `storage` | Lưu session, settings, badges (local) |
| `offscreen` | Tạo offscreen doc cho camera + MediaPipe |
| `notifications` | Cảnh báo khi mất tập trung |
| `scripting` | Inject content script vào tab đã mở |
| `host_permissions: <all_urls>` | Inject content script trên mọi trang |

## User Flow

1. Mở popup → chọn task, mode, duration, advanced settings → **Bắt đầu**
2. Nếu camera bật → CameraModal xin quyền → xác nhận hoặc skip
3. Session chạy → widget hiển thị trên tab active → countdown realtime
4. Chuyển tab → widget tự di chuyển theo, tab cũ tự dọn widget
5. Vi phạm mục tiêu → toast cảnh báo đỏ, nhắc lại mỗi 30s
6. Hết giờ hoặc bấm Dừng → kết quả + badges + AI + PDF + Share

## Bảo mật & Quyền riêng tư

- **100% xử lý cục bộ** — không gửi dữ liệu lên server (ngoại trừ AI opt-in)
- Không lưu ảnh/video từ camera
- Không đọc nội dung trang web
- API key được XOR-obfuscate trong memory
- AI Analysis chỉ hoạt động khi user chủ động bấm nút
- Session hash SHA-256 xác thực tính toàn vẹn

## Lưu ý Quan trọng

- **Chrome 116+** là phiên bản tối thiểu được hỗ trợ
- File `.env` **KHÔNG ĐƯỢC commit** lên git (đã có trong `.gitignore`)
- Sau khi reload extension, cần mở lại tab web để content script inject
- Camera chỉ hoạt động trong full-tab context (không phải popup)
- MediaPipe WASM/model files (~18MB) nằm trong `public/` — cần được copy khi setup
- Sau khi sửa code, luôn chạy `npm run type-check` trước khi build
