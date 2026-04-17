# FocusProof

**Chứng chỉ Tập trung Thông minh & Xác thực**

Chrome Extension (Manifest V3) giúp đo lường, ghi nhận và chứng minh mức độ tập trung trong các phiên làm việc/học tập.

## Tech Stack

- **Build**: Vite 5 + @crxjs/vite-plugin
- **UI**: React 19 + TypeScript (strict)
- **Face Detection**: @mediapipe/tasks-vision (BlazeFace, WASM local)
- **PDF**: jsPDF + html2canvas
- **QR**: qrcode
- **AI**: OpenAI GPT-4o-mini (opt-in)
- **Testing**: Vitest + jsdom + Chrome API mocks
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
# Chạy tất cả tests
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
│   ├── icons/               PNG icons (16, 48, 128)
│   ├── models/              MediaPipe model (.tflite)
│   └── wasm/                MediaPipe WASM runtime
├── src/
│   ├── background/          Service Worker (session, sampling, tracking)
│   ├── content-script/      Activity tracking + Floating Widget
│   ├── offscreen/           Camera + MediaPipe face detection
│   ├── popup/
│   │   ├── components/      React components (StartScreen, ResultScreen...)
│   │   ├── App.tsx          Main app component
│   │   ├── App.css          Styles
│   │   ├── index.html       Entry HTML
│   │   └── main.tsx         React entry point
│   ├── utils/
│   │   ├── types.ts         Core types & constants
│   │   ├── storage.ts       chrome.storage wrapper
│   │   ├── api-key.ts       XOR obfuscation cho API key
│   │   ├── focus.ts         Score calculation & grading
│   │   └── goal-evaluator.ts  isGoalCompliant & isDomainAllowed
│   └── __tests__/           Unit tests
├── .env                     API key (KHÔNG commit)
├── .env.example             Template cho .env
├── manifest.json            Chrome Extension manifest (MV3)
├── vite.config.ts           Vite + CRXJS config
├── vitest.config.ts         Test config
├── tsconfig.json            TypeScript config
└── package.json
```

## Quyền Extension

| Permission | Mục đích |
|-----------|----------|
| `tabs` | Theo dõi tab/domain đang active |
| `activeTab` | Truy cập tab hiện tại |
| `storage` | Lưu session, settings, badges (local) |
| `offscreen` | Tạo offscreen doc cho camera + MediaPipe |
| `notifications` | Cảnh báo khi mất tập trung |

## Bảo mật & Quyền riêng tư

- **100% xử lý cục bộ** — không gửi dữ liệu lên server (ngoại trừ AI opt-in)
- Không lưu ảnh/video từ camera
- Không đọc nội dung trang web
- API key được XOR-obfuscate trong memory
- AI Analysis chỉ hoạt động khi user chủ động bật

## Lưu ý Quan trọng

- **Chrome 116+** là phiên bản tối thiểu được hỗ trợ
- File `.env` **KHÔNG ĐƯỢC commit** lên git (đã có trong `.gitignore`)
- MediaPipe WASM/model files (~18MB) nằm trong `public/` — cần được copy khi setup
- Sau khi sửa code, luôn chạy `npm run type-check` trước khi build
