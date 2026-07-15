# FocusProof — Bản đồ dự án & Cách trình bày

Tài liệu này giúp bạn (và người nghe) hiểu dự án trong 5 phút: cấu trúc thư mục,
file nào quan trọng và làm gì, và cách kể câu chuyện dự án cho mạch lạc.

---

## 1. Bức tranh tổng thể — dự án gồm 3 phần

FocusProof KHÔNG chỉ là 1 extension. Nó là một hệ thống 3 mảnh ghép:

```
┌────────────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│  A. EXTENSION (src/)    │     │  B. BACKEND (server/) │     │  C. WEB (web/)      │
│  Chrome MV3 · React     │◄───►│  Node/Express         │◄───►│  Landing + Dashboard│
│  Đo & chấm điểm tập     │     │  Proxy AI · Ký & lưu  │     │  Bán hàng · Trang   │
│  trung, xuất chứng chỉ  │     │  chứng chỉ · Analytics│     │  /verify quét QR    │
└────────────────────────┘     └──────────────────────┘     └────────────────────┘
        (bắt buộc)                  (nâng cấp cộng thêm)          (marketing + verify)
```

- **A. Extension** — sản phẩm chính, chạy được độc lập 100% (privacy-first, offline).
- **B. Backend** — tùy chọn: giữ API key, xác thực chứng chỉ thật, nhận analytics.
- **C. Web** — landing page bán hàng + dashboard + trang xác minh QR (nối với B).

> **Điểm nhấn khi thuyết trình:** không có B và C thì A vẫn chạy đầy đủ. B/C là lớp
> mở rộng cho câu chuyện kinh doanh và xác thực — không phải phụ thuộc cứng.

---

## 2. Cấu trúc thư mục (có chú thích)

```
Extension_FocusProof/
│
├─ manifest.json          ★ "Khai sinh" extension: khai báo 4 ngữ cảnh + quyền + CSP
├─ vite.config.ts         Cấu hình build (có plugin dọn WASM trùng, chống remote code)
├─ package.json           Scripts (dev/build/test/lint) + dependencies
├─ .env / .env.example    Biến môi trường (API proxy, verify, analytics — đều tùy chọn)
│
├─ src/                   ★★★ MÃ NGUỒN EXTENSION (phần quan trọng nhất)
│  │
│  ├─ manifest 4 ngữ cảnh của Manifest V3:
│  ├─ popup/              [1] GIAO DIỆN — cửa sổ React khi bấm icon
│  │  ├─ App.tsx              Điều phối 6 bước: Start→Camera→Running→Result→History
│  │  ├─ main.tsx             Entry React + cài error handler
│  │  ├─ components/          StartScreen, RunningScreen, ResultScreen, HistoryScreen,
│  │  │                       CameraModal, DiagnosticDashboard, ErrorBoundary
│  │  └─ styles/              CSS từng màn hình
│  │
│  ├─ background/         [2] SERVICE WORKER — "bộ não" chạy nền
│  │  ├─ index.ts             Entry: định tuyến message + bắt sự kiện Chrome + analytics
│  │  ├─ session-manager.ts   ★ Vòng đời phiên + vòng lấy mẫu mỗi 6 giây (trái tim logic)
│  │  ├─ tab-tracker.ts       Theo dõi tab/cửa sổ đang hoạt động
│  │  ├─ goal-manager.ts      Ghép cấu hình mục tiêu với tab hiện tại
│  │  ├─ alert-manager.ts     Trạng thái cảnh báo realtime
│  │  └─ offscreen-manager.ts Tạo/hủy tài liệu offscreen (camera)
│  │
│  ├─ content-script/     [3] CHÈN VÀO TRANG WEB — "đôi mắt" trên trang
│  │  ├─ index.ts             Đếm phím/click/scroll (chỉ con số, KHÔNG đọc nội dung)
│  │  ├─ widget.ts            Widget nổi realtime (điểm số + đếm ngược + cảnh báo)
│  │  └─ web-bridge.ts        Cầu nối extension ↔ web app focusproof.com
│  │
│  ├─ offscreen/          [4] TÀI LIỆU ẨN — nơi duy nhất truy cập camera trong MV3
│  │  ├─ offscreen.ts         Camera + MediaPipe BlazeFace → trả {detected, confidence}
│  │  └─ offscreen.html
│  │
│  ├─ utils/              ★★ LOGIC DÙNG CHUNG (thuần, dễ test)
│  │  ├─ types.ts             ★ Nguồn sự thật: mọi type + hằng số (trọng số, ngưỡng)
│  │  ├─ focus.ts             ★ Engine chấm điểm: chuẩn hóa 3 tín hiệu → điểm + hạng S–F
│  │  ├─ goal-evaluator.ts    Kiểm tra domain/tab có đúng mục tiêu không
│  │  ├─ alert-system.ts      Logic sinh 4 loại cảnh báo (mất mặt/idle/sai tab/rời Chrome)
│  │  ├─ gamification.ts      10 huy hiệu điều kiện mở khóa
│  │  ├─ ai-analysis.ts       Gọi GPT-4o-mini (qua proxy) → nhận xét coaching
│  │  ├─ local-analysis.ts    ★ Engine phân tích OFFLINE (dự phòng, không cần key/mạng)
│  │  ├─ certificate.ts       Tạo chứng chỉ PDF 2 trang (jsPDF, font Việt)
│  │  ├─ certificate-signing.ts ★ Dấu vân tay SHA-256 + verify + đăng ký backend
│  │  ├─ qr-code.ts           Sinh QR (payload tự chứng thực hoặc URL verify)
│  │  ├─ analytics.ts         ★ Theo dõi sự kiện + bắt lỗi runtime (privacy-first)
│  │  ├─ api-key.ts           Cấu hình AI (proxy ưu tiên; ghi chú bảo mật trung thực)
│  │  ├─ voice-note.ts        Ghi chú giọng nói (Web Speech API)
│  │  └─ storage.ts           Bọc chrome.storage.local (type-safe)
│  │
│  └─ __tests__/          209 test (Vitest) — chạy: npm test
│
├─ public/                Tài sản tĩnh: icons, fonts Việt, WASM + model BlazeFace,
│                         trang chẩn đoán camera/widget
├─ scripts/               copy-mediapipe.mjs (copy WASM sau install)
│
├─ server/                ★ B. BACKEND (reference) — Node/Express
│  ├─ index.js                4 endpoint: /ai-analyze, /certificates, /verify/:id, /events
│  ├─ README.md               Hướng dẫn deploy + nối với extension
│  └─ .env.example            OPENAI_API_KEY, CERT_SIGNING_SECRET…
│
├─ web/                   ★ C. WEB — landing page + dashboard (Vite + React + Tailwind)
│  └─ src/
│     ├─ pages/               HomePage, PricingPage, DashboardPage, TeamDashboardPage,
│     │                       VerifyPage (quét QR → xác minh chứng chỉ)
│     ├─ components/          Hero, Pricing, FAQ, QR Momo, Auth…
│     ├─ services/            extensionBridge (nối web↔extension), mockApi
│     └─ i18n/                Song ngữ vi/en
│
├─ docs/                  TÀI LIỆU
│  ├─ BAO_CAO_CAI_TIEN_FOCUSPROOF.md   ★ Báo cáo phản hồi góp ý của thầy
│  ├─ PERMISSIONS_AND_SECURITY.md      Giải trình quyền <all_urls> (cho Q&A)
│  ├─ CAU_TRUC_DU_AN.md                (file này)
│  ├─ CHROME_WEBSTORE_SUBMISSION.md    Hồ sơ nộp Web Store
│  └─ v1.1_monetization_startup/       Pitch deck, poster, video, diagrams, kế hoạch KD
│
├─ y_tuong.md             Ý tưởng gốc (đặc tả thuật toán, tính năng)
└─ ke_hoach.md            Kế hoạch phát triển
```

---

## 3. Nội dung 8 file quan trọng nhất (đọc là hiểu 80% dự án)

### ① `manifest.json` — bản khai sinh
Khai báo extension theo chuẩn Manifest V3: 4 ngữ cảnh (popup, service worker,
content script, offscreen), danh sách quyền, và CSP. Đọc file này biết ngay
extension "được phép làm gì" và "gồm những mảnh nào".

### ② `src/utils/types.ts` — nguồn sự thật của dữ liệu
Định nghĩa TẤT CẢ kiểu dữ liệu + hằng số quan trọng: `SessionData` (một phiên),
`Sample` (1 mẫu mỗi 6s), các **trọng số chấm điểm** (`WEIGHTS_CAMERA_ON = face 40%
+ activity 35% + tab 25%`; `CAMERA_OFF = activity 60% + tab 40%`), ngưỡng cảnh báo.
Muốn hiểu "hệ thống nghĩ về dữ liệu thế nào" → đọc file này đầu tiên.

### ③ `src/utils/focus.ts` — TRÁI TIM: engine chấm điểm
Ba việc: (a) **chuẩn hóa** 3 tín hiệu về thang 0–1 (mặt, hoạt động, tab); (b) nhân
trọng số → điểm 1 mẫu; (c) trung bình cả phiên → điểm 0–100 và **xếp hạng S–F**.
Cũng có `computeSessionStats()` tổng hợp cho AI + chứng chỉ. Đây là chỗ thể hiện rõ
nhất "chứng minh tập trung bằng dữ liệu".

### ④ `src/background/session-manager.ts` — bộ não điều phối
Quản lý toàn bộ vòng đời phiên: **start → vòng lặp lấy mẫu mỗi 6s → stop → chốt
điểm + hash + huy hiệu**. Vòng `doSample()` là nơi mọi thứ hội tụ: lấy tín hiệu
mặt (offscreen), hoạt động (content script), tab (tab-tracker) → tính điểm → sinh
cảnh báo → cập nhật widget. Cũng lo khôi phục phiên khi service worker bị kill.

### ⑤ `src/offscreen/offscreen.ts` — camera & nhận diện mặt
Chỗ duy nhất chạm camera (MV3 cấm service worker truy cập DOM). Dùng MediaPipe
BlazeFace (WASM chạy **local**) chỉ để trả `có/không có mặt + độ tin cậy` — **không
lưu ảnh**. Điểm cộng lớn về riêng tư & hiệu năng.

### ⑥ `src/content-script/widget.ts` + `index.ts` — đôi mắt trên trang
`index.ts` đếm phím/click/scroll (chỉ con số) và đọc hostname. `widget.ts` vẽ
widget nổi realtime (điểm, đếm ngược, toast cảnh báo). Quan trọng: **không hề đọc
nội dung trang** — điểm mấu chốt để trả lời câu hỏi bảo mật.

### ⑦ `src/utils/certificate.ts` (+ `certificate-signing.ts`, `qr-code.ts`) — sản phẩm đầu ra
Tạo **chứng chỉ PDF 2 trang** (điểm lớn, breakdown tín hiệu, top domain, QR, hash).
`certificate-signing.ts` lo tính **dấu vân tay SHA-256** (chống sửa dữ liệu) và
đăng ký lên backend để có xác thực thật. Đây là "vật phẩm" người dùng khoe ra.

### ⑧ `server/index.js` — backend (nếu deploy)
4 endpoint gọn: `ai-analyze` (giữ key), `certificates` + `verify/:id` (ký HMAC &
xác thực thật khi quét QR), `events` (analytics). Biến 3 điểm yếu (backend/CSDL/
analytics) thành năng lực thật.

---

## 4. Cách trình bày cho người khác hiểu

### Cách 1 — Kể theo "hành trình 1 phiên tập trung" (dễ hiểu nhất)
Vẽ 6 bước, mỗi bước chỉ 1 câu:

1. **Đặt mục tiêu** — Mở popup, chọn công việc + chế độ (học/làm/code/xem giảng),
   bật/tắt camera → bấm Bắt đầu.
2. **Bắt đầu đo** — Service worker tạo tài liệu camera + chèn widget vào trang,
   khởi động vòng lấy mẫu mỗi 6 giây.
3. **Đo realtime** — Mỗi 6s hệ thống hỏi 3 câu: *Có mặt trước màn hình không?*
   *Có đang thao tác không?* *Có ở đúng trang mục tiêu không?* → ra 1 điểm mẫu.
   Widget hiển thị điểm sống + cảnh báo nếu xao nhãng.
4. **Kết thúc** — Trung bình các mẫu → điểm 0–100 + hạng S–F, sinh dấu vân tay
   SHA-256, mở khóa huy hiệu, lưu lịch sử.
5. **Phân tích** — AI (hoặc engine offline) đưa nhận xét coaching + gợi ý cải thiện.
6. **Chứng chỉ** — Xuất PDF có QR; người khác quét QR để xác minh phiên là thật.

### Cách 2 — Kể theo "kiến trúc 4 lớp" (cho câu hỏi kỹ thuật)
Một slide, 4 hộp + mũi tên message:
- **Popup (React)** — điều khiển & hiển thị.
- **Service Worker** — bộ não, vòng lấy mẫu, chốt điểm (luôn chạy nền).
- **Content Script** — đôi mắt trên trang (hoạt động + widget).
- **Offscreen** — camera + MediaPipe (nhận diện mặt local).
- Nối thêm **Backend mỏng** (proxy AI + verify) để kể chuyện bảo mật/CSDL.

### Câu "chốt hạ" 30 giây (elevator pitch)
> "Pomodoro chỉ đếm giờ, còn FocusProof **chứng minh bạn thật sự tập trung bằng dữ
> liệu**: kết hợp 3 tín hiệu (khuôn mặt, thao tác, đúng-tab) mỗi 6 giây thành điểm
> tập trung có xếp hạng, rồi cấp một **chứng chỉ PDF xác thực được** — tất cả xử lý
> **cục bộ, riêng tư**, camera không lưu ảnh."

### Mẹo trình bày
- Luôn mở bằng **vấn đề & insight** trước khi khoe tính năng.
- Demo live theo "hành trình 1 phiên" — cố ý mở Facebook để **kích cảnh báo**.
- Chủ động nói bảo mật/quyền **trước khi bị hỏi** (dùng PERMISSIONS_AND_SECURITY.md).
- Có video backup phòng lỗi camera/mạng.
