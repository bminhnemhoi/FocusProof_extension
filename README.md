<div align="center">

# 🎯 FocusProof

### Chứng chỉ Tập trung Thông minh & Xác thực

**Chrome Extension (Manifest V3) giúp đo lường, ghi nhận và chứng minh mức độ tập trung**  
**trong các phiên làm việc & học tập — 100% xử lý cục bộ.**

![Version](https://img.shields.io/badge/version-1.0.0-6366f1?style=flat-square)
![Chrome](https://img.shields.io/badge/Chrome-116%2B-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-184%20passed-22c55e?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-gray?style=flat-square)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Tech Stack](#-tech-stack)
- [Cài đặt & Setup](#-cài-đặt--setup)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Kiểm thử](#-kiểm-thử)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Quyền Extension](#-quyền-extension)
- [Bảo mật & Quyền riêng tư](#-bảo-mật--quyền-riêng-tư)
- [Changelog](#-changelog)
- [Lưu ý quan trọng](#-lưu-ý-quan-trọng)

---

## 🧠 Giới thiệu

**FocusProof** kết hợp **ba nguồn tín hiệu thời gian thực** để đánh giá khách quan mức độ tập trung:

| Tín hiệu | Công nghệ | Mô tả |
|-----------|-----------|-------|
| 👤 **Face Detection** | MediaPipe BlazeFace (WASM) | Phát hiện sự hiện diện khuôn mặt qua webcam — không lưu ảnh |
| ⌨️ **Activity Tracking** | Content Script | Bàn phím (IME tiếng Việt), chuột, cuộn trang, paste, idle |
| 🌐 **Tab & Screen Tracking** | Chrome APIs | Domain/URL realtime, phát hiện rời Chrome |

Kết quả phiên được tổng hợp thành **chứng chỉ PDF 2 trang chuyên nghiệp** kèm phân tích AI song ngữ Việt – Anh, mã QR tự xác thực SHA-256, và watermark chống giả mạo.

---

## ✨ Tính năng

### 🔍 Core Engine
- **Face Detection** — MediaPipe BlazeFace chạy 100% local (WASM + GPU fallback CPU)
- **Activity Tracking** — 10 loại sự kiện (keydown/IME, click, mousemove, scroll, input, focusin, window focus, touchstart, paste, drop)
- **Goal-based Evaluation** — 4 chế độ mục tiêu + custom allowed domains
- **Real-time Alert System** — 4 loại cảnh báo (face-lost 8s, idle 25s, tab-violation 30s, outside-chrome 30s)
- **Camera-Off Mode** — chạy không camera, tự điều chỉnh trọng số (Activity 60% + Tab 40%)
- **Multi-Tab Guard** — Strict Mode (1 tab), domain whitelist tùy chỉnh

### 🎨 Trải nghiệm người dùng
- **Floating Widget** — Shadow DOM overlay, draggable, minimize 48px, countdown 1s, touch support
- **7 màn hình React** — Start → Camera → Running → Result → History → Diagnostics → Error Boundary
- **Dark Theme** — 3 chế độ (system/light/dark) với CSS variables
- **Gamification** — 10 huy hiệu thành tích (Bước Đầu Tiên, Bậc Thầy, Marathon, Cú Đêm...)

### 📄 Output & Phân tích
- **Certificate PDF 2 trang** — Page 1: Score + Domains + Signal Breakdown | Page 2: AI Analysis only
- **AI Analysis** — GPT-4o-mini phân tích song ngữ Việt-Anh, coaching tone, trend analysis (opt-in)
- **Voice Note** — Web Speech API, tối đa 30s, tích hợp vào AI prompt
- **Quick Test** — Chế độ test nhanh 3 phút

### 📊 Lịch sử & Chia sẻ
- **History** — Heatmap 7 ngày, biểu đồ cột, lọc theo mode, export CSV
- **Domain Duration Tracking** — Biểu đồ bar + pie chart trực quan trong ResultScreen
- **Chia sẻ** — Nút share Facebook/TikTok, download PDF

---

## 🛠 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Build** | Vite 5 + @crxjs/vite-plugin |
| **UI** | React 19 + TypeScript (strict mode) |
| **Face Detection** | @mediapipe/tasks-vision 0.10.14 (BlazeFace, WASM local) |
| **PDF** | jsPDF + html2canvas |
| **QR Code** | qrcode |
| **AI** | OpenAI GPT-4o-mini (opt-in, 30s timeout) |
| **Testing** | Vitest 2.1 + jsdom + Chrome API mocks |
| **Lint** | ESLint 9 + Prettier 3 + husky + lint-staged |

---

## 🚀 Cài đặt & Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd Extension_FocusProof
npm install
```

> `npm install` tự động chạy `postinstall` script để copy MediaPipe WASM/model files.

### 2. Cấu hình API Key (tùy chọn)

```bash
cp .env.example .env
```

Mở `.env` và thay `sk-your-api-key-here` bằng API key thật từ [OpenAI Platform](https://platform.openai.com/api-keys).

> **Không có key?** App vẫn chạy bình thường — chỉ tính năng AI Analysis bị vô hiệu.

### 3. Build Extension

```bash
# Development (HMR)
npm run dev

# Production build
npm run build
```

### 4. Load vào Chrome

1. Mở `chrome://extensions/`
2. Bật **Developer mode** (góc trên phải)
3. Click **Load unpacked** → chọn thư mục `dist/`
4. Extension **FocusProof** xuất hiện trên toolbar

> 💡 Sau mỗi lần build lại, nhấn nút reload (🔄) trên card FocusProof trong `chrome://extensions/`.

---

## 📖 Hướng dẫn sử dụng

### Luồng sử dụng cơ bản

```
1. Click icon FocusProof → Popup mở ra
2. Nhập tên task → chọn mode (Study / Work / Programming / Video Lecture)
3. Cấu hình: thời gian, camera, allowed domains, strict mode
4. Bấm "Bắt đầu" → (Camera modal nếu bật) → Session chạy
5. Widget floating hiển thị trên tab → countdown realtime
6. Chuyển tab sai mục tiêu → cảnh báo đỏ nhắc lại mỗi 30s
7. Hết giờ / bấm Dừng → Kết quả + Badges + AI + PDF + Share
```

### 4 chế độ mục tiêu

| Mode | Allowed Domains mặc định | External Apps |
|------|--------------------------|---------------|
| 📚 **Study** | docs.google.com, drive.google.com, notion.so, evernote.com | ✅ Cho phép |
| 💼 **Work** | docs.google.com, drive.google.com, notion.so | ✅ Cho phép |
| 💻 **Programming** | github.com, gitlab.com, localhost, vscode.dev, stackblitz.com | ❌ Không |
| 🎥 **Video Lecture** | youtube.com, coursera.org, udemy.com, zoom.us | ❌ Không |

> Bạn có thể **thêm custom domains** và **override external apps rule** trong Advanced Settings.

### Hệ thống cảnh báo realtime

| Alert | Điều kiện | Hành vi |
|-------|-----------|---------|
| 😶 Face Lost | Không thấy mặt > 8 giây | Widget rung + toast |
| 💤 Idle | Không hoạt động > 25 giây | Cảnh báo idle |
| 🚫 Tab Violation | Domain không phù hợp mục tiêu | Flash đỏ, nhắc lại 30s |
| 🔴 Outside Chrome | Rời Chrome (khi không cho phép) | Widget đỏ, nhắc lại 30s |

### Chứng chỉ PDF 2 trang

- **Page 1** — Focus Score (gradient circle), session info, top domains (bar chart), signal breakdown, QR code SHA-256, watermark
- **Page 2** — AI Analysis only: tóm tắt Việt/Anh, focus pattern, recommendations

---

## 🧪 Kiểm thử

```bash
# Chạy tất cả tests (184 tests, 11 files)
npm test

# Watch mode
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

### Test Coverage

| File | Tests | Mô tả |
|------|:-----:|-------|
| focus.test.ts | ✅ | Score calculation, grading |
| goal-evaluator.test.ts | ✅ | isGoalCompliant, isDomainAllowed |
| alert-system.test.ts | ✅ | 4 alert types, repeat logic |
| session-manager.test.ts | ✅ | Session lifecycle, sampling |
| certificate.test.ts | ✅ | PDF generation, fonts, QR |
| ai-analysis.test.ts | ✅ | AI prompt, timeout, error handling |
| gamification.test.ts | ✅ | 10 badges criteria |
| tab-tracker.test.ts | ✅ | Tab state tracking |
| content-script.test.ts | ✅ | Activity tracking, messages |
| qr-code.test.ts | ✅ | QR generation |
| voice-note.test.ts | ✅ | Web Speech API |

---

## 📁 Cấu trúc dự án

```
Extension_FocusProof/
├── public/
│   ├── icons/                 PNG icons (16, 48, 128) + SVG
│   ├── fonts/                 Roboto TTF (Regular, Bold, Italic)
│   ├── models/                MediaPipe BlazeFace (.tflite)
│   ├── wasm/                  MediaPipe WASM runtime (SIMD + noSIMD)
│   ├── camera-diagnostic.*    Trang kiểm tra camera & micro
│   ├── alert-diagnostic.*     Trang kiểm tra alert
│   └── widget-diagnostic.*    Trang kiểm tra widget
├── src/
│   ├── background/
│   │   ├── index.ts           Message router, Chrome events, startup recovery
│   │   ├── session-manager.ts Session lifecycle, sampling, hash, badges
│   │   ├── tab-tracker.ts     Tab/window state tracking
│   │   ├── goal-manager.ts    GoalConfig + TabResult builder
│   │   ├── alert-manager.ts   Realtime alert state wrapper
│   │   └── offscreen-manager.ts  Offscreen document lifecycle
│   ├── content-script/
│   │   ├── index.ts           Activity tracking (IME-aware) + message handler
│   │   └── widget.ts          Shadow DOM floating widget + countdown + alerts
│   ├── offscreen/
│   │   ├── offscreen.ts       Camera + MediaPipe (GPU → CPU fallback)
│   │   └── offscreen.html     Hidden video element
│   ├── popup/
│   │   ├── components/        7 React components
│   │   │   ├── StartScreen.tsx       Task, mode, duration, advanced settings
│   │   │   ├── CameraModal.tsx       Camera permission + preview
│   │   │   ├── RunningScreen.tsx     Live timer, score, alerts
│   │   │   ├── ResultScreen.tsx      Score, badges, charts, AI, PDF, Share
│   │   │   ├── HistoryScreen.tsx     Heatmap, bar chart, filter, CSV
│   │   │   ├── DiagnosticDashboard.tsx  Camera + permission diagnostics
│   │   │   └── ErrorBoundary.tsx     React error boundary
│   │   ├── styles/            CSS per component + global dark theme
│   │   ├── App.tsx            Screen orchestrator
│   │   ├── main.tsx           Entry point
│   │   └── index.html         HTML entry
│   ├── utils/
│   │   ├── types.ts           Core types, constants, weights
│   │   ├── focus.ts           Score calculation & grading
│   │   ├── storage.ts         chrome.storage wrapper (100 session limit)
│   │   ├── alert-system.ts    4 alert types with 30s repeat
│   │   ├── goal-evaluator.ts  isGoalCompliant & isDomainAllowed
│   │   ├── gamification.ts    10 badges with criteria
│   │   ├── certificate.ts     2-page PDF (watermark, QR, embedded fonts)
│   │   ├── ai-analysis.ts     GPT-4o-mini (coaching tone, trend analysis)
│   │   ├── qr-code.ts         QR with session hash
│   │   ├── voice-note.ts      Web Speech API (30s max)
│   │   └── api-key.ts         XOR obfuscation
│   └── __tests__/             11 test files, 184 tests
├── manifest.json              Chrome Extension Manifest V3
├── vite.config.ts             Vite + CRXJS config
├── vitest.config.ts           Test config (jsdom)
├── tsconfig.json              TypeScript strict config
├── eslint.config.js           ESLint 9 flat config
└── package.json               Dependencies & scripts
```

---

## 🔐 Quyền Extension

| Permission | Mục đích |
|-----------|----------|
| `tabs` | Theo dõi tab/domain đang active |
| `activeTab` | Truy cập tab hiện tại |
| `storage` | Lưu session, settings, badges (chrome.storage.local) |
| `offscreen` | Tạo offscreen document cho camera + MediaPipe |
| `notifications` | Cảnh báo hệ thống khi mất tập trung |
| `scripting` | Inject content script vào tab đã mở |
| `host_permissions: <all_urls>` | Activity tracking + widget trên mọi trang |

---

## 🛡 Bảo mật & Quyền riêng tư

- **100% xử lý cục bộ** — không gửi dữ liệu lên server (ngoại trừ AI opt-in)
- Không lưu ảnh/video từ camera — chỉ đọc confidence score
- Không đọc nội dung trang web — chỉ đọc domain/URL
- API key được XOR-obfuscate trong memory
- AI Analysis chỉ hoạt động khi user **chủ động bấm nút**
- Session hash **SHA-256** xác thực tính toàn vẹn chứng chỉ
- CSP: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`

---

## 📝 Changelog

### v1.0.0 (2026-04-18)

**Initial Release** — Phiên bản chính thức đầu tiên.

- ✅ Core Engine: Face Detection + Activity Tracking + Tab & Screen Tracking
- ✅ 4 chế độ mục tiêu (Study, Work, Programming, Video Lecture)
- ✅ Goal-based Evaluation với custom allowed domains
- ✅ Real-time Alert System (4 loại, repeat 30s)
- ✅ Floating Widget (Shadow DOM, draggable, minimize, touch)
- ✅ Certificate PDF 2 trang (watermark, QR SHA-256, font Roboto tiếng Việt)
- ✅ AI Analysis GPT-4o-mini (song ngữ, coaching tone, trend analysis)
- ✅ Voice Note (Web Speech API, 30s max)
- ✅ Quick Test mode (3 phút)
- ✅ Domain Duration Tracking (bar chart + pie chart)
- ✅ Gamification (10 huy hiệu)
- ✅ History (heatmap, biểu đồ, filter, CSV export)
- ✅ Dark Theme (system/light/dark)
- ✅ Camera-Off Mode
- ✅ Multi-Tab Guard + Strict Mode
- ✅ 184 tests passed (11 files)
- ✅ TypeScript strict, ESLint, Prettier

---

## ⚠️ Lưu ý quan trọng

- **Chrome 116+** là phiên bản tối thiểu
- File `.env` **không được commit** lên git (đã có trong `.gitignore`)
- Sau khi reload extension, cần **mở lại tab** để content script inject
- Camera chỉ hoạt động trong full-tab context (không phải popup)
- MediaPipe WASM/model files (~18MB) nằm trong `public/` — tự động copy khi `npm install`
- Luôn chạy `npm run type-check` trước khi build production

---

<div align="center">

**Built with ❤️ using React 19 + TypeScript + Vite 5**

*FocusProof — Đo lường tập trung, chứng minh nỗ lực.*

</div>
