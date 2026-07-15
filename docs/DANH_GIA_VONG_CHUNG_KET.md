# FocusProof — Đánh giá toàn diện trước Vòng Chung kết

> Ngày đánh giá: 11/07/2026 · Phương pháp: 30 agent độc lập đọc toàn bộ mã nguồn, chạy build/test thật (209/209 pass), kiểm chứng từng góp ý vòng trước bằng code, chấm điểm độc lập 10 tiêu chí rubric, nghiên cứu thị trường/Web Store bằng nguồn web có dẫn chứng.

---

## ✅ TRẠNG THÁI SAU ĐỢT SỬA (11/07/2026)

Đã triển khai xong loạt cải tiến. Kiểm chứng cuối: **lint sạch · type-check sạch · 266/266 test pass (client) · 13/13 test pass (server) · build thành công · dist không còn secret**. Gói nộp: `focusproof-v1.0.1.zip` (7.7MB, đã dọn WASM lặp).

**Đã sửa:**
- 🔴→✅ Bug kéo widget phình màn hình (dùng `setProperty(...,'important')`) + hiển thị khi fullscreen + toast bền.
- 🔴→✅ Strict Mode thực thi thật (phạt khi đổi tab); cờ "rời Chrome" không còn bị reset oan (hỏi `windows.getLastFocused().focused`).
- 🔴→✅ Domain matching chuyển hostname/subdomain — chống lách kiểu `fake-notion.so.evil.com` (thêm test).
- 🔴→✅ Keylogger: nội dung gõ mặc định TẮT (opt-in qua consent), không bao giờ thu từ ô mật khẩu/OTP/thẻ.
- 🔴→✅ Key OpenAI gỡ khỏi `.env` build, chuyển sang `server/.env`; thêm `check-no-secrets` chặn tái diễn (đã bắt đúng key trong dist cũ). **Việc còn lại của bạn: thu hồi key cũ trên platform.openai.com.**
- 🟡→✅ Backend: SQLite thật (node:sqlite), HMAC v2 phủ toàn record, token bảo vệ, chống ghi đè (409), `/api/stats`, fail-fast production, 13 test. Còn phát hiện & sửa bug `npm start` không nạp `.env`.
- 🟡→✅ Consent/onboarding screen (disclosure + 2 opt-in) — yêu cầu cứng Web Store; hiện lỗi START_SESSION thay vì nuốt im lặng; nhớ cấu hình phiên; hướng dẫn mở lại quyền camera khi bị block.
- 🟡→✅ Analytics: phủ error logging cho offscreen + content script; panel 10 lỗi gần nhất + xuất log; mask path trong stack.
- 🟡→✅ Backup/Restore JSON có versioning + validate (tiêu chí "sao lưu dữ liệu").
- 🟡→✅ CI/CD (`.github/workflows/ci.yml`), `npm run package`, husky chạy thật, version 1.0.1, `externally_connectable` dọn sạch localhost/wildcard, xóa 2 zip cũ.
- 🟡→✅ Watchdog `chrome.alarms` chống phiên chết khi SW bị kill; `stopSession` idempotent; badge Marathon theo thời gian thực; footer PDF trung thực nguồn AI; CSV escape; ngày local (hết lệch UTC+7); loại `__outside_chrome__` khỏi top domains.

**Còn lại (quyết định có chủ đích, cần bạn xử lý ngoài code):**
- `host_permissions <all_urls>` giữ nguyên (cần cho theo dõi tab liên tục suốt phiên) — đã có justification; thu hẹp thành optional cần test kỹ, để sau kỳ thi.
- Deploy `server/` lên Render/Railway + đổi 3 biến `VITE_*_URL` sang URL production rồi build lại (hiện trỏ localhost cho demo).
- Host privacy policy công khai + chụp screenshot 1280×800 cho Web Store.
- Đo CPU/RAM thật phiên 60-90 phút đưa vào slide.

---

## 1. Tổng điểm ước lượng: **65.5/100** (vòng trước: 59/100)

| # | Tiêu chí | Vòng trước | Hiện tại | Nhận xét ngắn |
|---|----------|:---:|:---:|---|
| 1 | Giao diện người dùng | 7 | **6.5** | Popup rất tốt (design token, dark mode, a11y) nhưng phát hiện **lỗi kéo widget làm nó phình kín màn hình** (đã tái hiện 100% bằng headless Chrome) + không có breakpoint responsive nào |
| 2 | Trải nghiệm người dùng | 7 | **8** | CameraModal 2 bước + hướng dẫn quyền trong sản phẩm = fix đúng góp ý. Thiếu: onboarding first-run, lỗi khởi tạo phiên bị nuốt im lặng |
| 3 | Tính logic ứng dụng | 7 | **6.5** | Bug alertCount=0 sửa triệt để (có test hồi quy). Nhưng lộ 2 bug mới: **Strict Mode không thực thi** và **cờ outside-chrome bị reset mỗi 6s** → tín hiệu tab gần như không vào điểm |
| 4 | Backend & API | 4 | **5.5** | Backend Express 5 endpoint là THẬT, thiết kế tốt. Nhưng **chưa deploy, bản build không gọi tới** (3 biến VITE_ trống) → "kết nối thông suốt" = 0 trong sản phẩm nộp |
| 5 | Cơ sở dữ liệu | 4 | **5.5** | Schema client type-safe tốt; server có registry chứng chỉ ký HMAC. Nhưng vẫn là file JSON, **chưa có DB engine thật** (không SQLite/Postgres) |
| 6 | Bảo mật | 6 | **5.5** | Thiết kế đúng hướng (proxy, HMAC, CSP, DOMPurify) nhưng thực thi phản bội thiết kế: **key OpenAI thật nằm plaintext trong dist/**, `<all_urls>` nguyên trạng, **keylogger không lọc ô mật khẩu** |
| 7 | Hiệu năng & Mở rộng | 6 | **6.5** | WASM hết lặp (41MB→22MB, có plugin prune tự động). Nhưng **chưa có số liệu CPU/RAM thật** — yêu cầu trực tiếp của giám khảo vẫn bỏ ngỏ |
| 8 | Phân tích & Theo dõi | 5 | **7.5** | Tiến bộ lớn nhất: analytics + error logging thật, cài ở background/popup/ErrorBoundary, có dashboard, 6/6 test. Hở: offscreen + content script chưa được phủ log |
| 9 | Vận hành & Cập nhật | 5 | **5.5** | Có error log + restore session + tài liệu phát hành. Vẫn **không có CI/CD** (.github/ không tồn tại), không backup/restore, husky khai báo nhưng không chạy |
| 10 | Chiến lược sản phẩm | 8 | **8.5** | Mạnh nhất: định vị sắc nét, TAM/SAM/SOM, unit economics, lộ trình 10 tuần. Trừ nhẹ: số liệu MRR mâu thuẫn nội bộ trong tài liệu |

**Lưu ý đọc điểm:** một số tiêu chí giảm không phải vì dự án tệ đi, mà vì đợt audit này soi sâu hơn vòng trước (chạy thực nghiệm headless Chrome, đọc từng dòng). Các lỗi tìm được đều sửa nhanh — xem mục 5.

---

## 2. Kiểm chứng 7 góp ý vòng trước

| Góp ý | Trạng thái | Bằng chứng |
|---|---|---|
| Bug alertCount = 0 | ✅ **ĐÃ SỬA** | `focus.ts:164` đọc `session.alerts` thật; 3 test hồi quy; xác nhận qua git diff |
| AI chết khi demo (key null) | ✅ **ĐÃ SỬA** | Kiến trúc 3 tầng: proxy → key dev → **fallback offline local-analysis.ts** (AI luôn có kết quả). ⚠️ Nhưng phát sinh lỗi mới: key thật lộ trong dist (xem mục 3) |
| Quyền `<all_urls>` quá rộng | ❌ **CHƯA SỬA** | manifest.json:14-16, 30-36 nguyên trạng ở cả 3 chỗ. Kế hoạch thu hẹp đã viết trong docs/PERMISSIONS_AND_SECURITY.md nhưng chưa thực thi — trong khi `ensureContentScript()` để inject runtime ĐÃ CÓ SẴN tại session-manager.ts:48 |
| "Chữ ký SHA-256" chưa phải chữ ký | 🟡 **SỬA MỘT PHẦN** | Client minh bạch hóa (đổi nhãn "SHA-256 Integrity"); chữ ký thật HMAC nằm ở server + trang /verify công khai. Kẽ hở: endpoint đăng ký không xác thực → ai cũng POST được bản ghi tự khai để server ký hộ |
| Analytics + error logging | 🟡 **SỬA PHẦN LỚN** | Code thật, test thật, dashboard thật. Hở: offscreen/content-script chỉ console.error; endpoint server chưa deploy |
| WASM/model lặp 2 nơi | 🟡 **SỬA TRONG BUILD MỚI** | Plugin `pruneDuplicatePublicAssets` hoạt động, dist sạch. Nhưng **2 file zip cũ ở root vẫn chứa bản lặp** — đó mới là thứ nộp đi |
| Backup/restore + kênh cập nhật | ❌ **CHƯA SỬA** | Chỉ có CSV một chiều (đã có từ v1.0). Không import, không CI/CD, chưa lên Web Store |

---

## 3. Phát hiện mới nghiêm trọng (chưa từng nêu ở vòng trước)

### 🔴 P0-1. OpenAI API key thật nằm plaintext trong bundle
`.env` chứa key thật → Vite nhúng nguyên văn vào `dist/assets/ai-analysis-*.js` (lớp XOR vô dụng vì Vite inline chuỗi gốc lúc build). Key chưa từng bị commit git (đã kiểm tra), nhưng nằm trong dist hiện tại.
**Việc phải làm ngay:** thu hồi key trên platform.openai.com → tạo key mới chỉ đặt ở server → xóa `VITE_OPENAI_API_KEY` khỏi `.env` → rebuild.

### 🔴 P0-2. Kéo widget một lần → widget phình gần kín màn hình
Xung đột CSS: `:host { bottom/right: 20px !important }` (widget.ts:40-42) thắng inline style `right='auto'` của handler kéo (widget.ts:489-490). Đã tái hiện bằng headless Chrome: 232×46px → **1192×634px**. Có ở cả mouse lẫn touch, đã đóng gói vào dist.
**Fix 1 dòng:** dùng `style.setProperty('right', 'auto', 'important')` hoặc bỏ `!important` khỏi bottom/right trong `:host`.

### 🔴 P0-3. Strict Mode không thực thi điều gì
UI hứa "chỉ 1 tab duy nhất" nhưng doSample không phạt khi `tabId !== sessionStartTabId`. Người dùng bật Strict Mode chuyển tab thoải mái mà không mất điểm/không có cảnh báo.

### 🔴 P0-4. Tín hiệu "rời Chrome" bị vô hiệu bởi chính vòng polling
`refreshCurrentTab()` (tab-tracker.ts:53) reset `isOutsideChrome = false` vô điều kiện mỗi 6 giây — chạy TRƯỚC khi đánh giá goal → alert `outside-chrome` và rule cấm app ngoài gần như không bao giờ kích hoạt. Đây là 1 trong 3 tín hiệu lõi của sản phẩm.

### 🔴 P0-5. Content script bắt phím không lọc ô mật khẩu, gửi lên OpenAI
`content-script/index.ts:95-108` bắt mọi ký tự trên mọi trang (kể cả `input[type=password]`), buffer 500 ký tự cuối được gửi lên OpenAI qua trường `typedContent`. Theo nghiên cứu chính sách Web Store: **đây là lý do reject số 1 của dự án** (thu thập "website content" + tiềm ẩn "authentication information" chuyển cho bên thứ ba, không có consent UI).

### 🟡 P1. Các lỗi đáng chú ý khác
- So khớp domain bằng substring 2 chiều (`goal-evaluator.ts:44-46`): `fake-notion.so.evil.com` được tính hợp lệ — trong khi hàm chuẩn `isDomainAllowed` cùng file đã viết đúng mà không dùng.
- Không có `chrome.alarms` → phiên đóng băng nếu service worker bị kill mà không có event đánh thức.
- `stopSession` không idempotent → có thể ghi lịch sử/chứng chỉ 2 lần.
- Badge Marathon xét theo thời lượng CẤU HÌNH chứ không phải thời gian thực.
- Widget biến mất khi video fullscreen — đúng use-case chế độ "Xem bài giảng".
- `sessionHistory` lưu nguyên mảng samples → 100 phiên ≈ 8-11MB, có thể chạm quota 10MB của chrome.storage.local.
- `externally_connectable` mở wildcard `https://*.vercel.app/*` — mọi site Vercel đều nói chuyện được với extension.
- Footer PDF luôn ghi "Analysis powered by GPT-4o-mini" kể cả khi phân tích offline.

---

## 4. Cấu trúc dữ liệu hiện tại

**Extension — toàn bộ trong `chrome.storage.local`** (không dùng sync/session; không xin `unlimitedStorage`):

| Key | Kiểu | Nội dung | Ghi/Đọc | Ghi chú |
|---|---|---|---|---|
| `currentSession` | `SessionData` | Phiên đang chạy: config, samples[] (6s/mẫu), alerts[], hash | SW ghi mỗi 5 mẫu (~30s); restoreSession đọc khi SW restart | Xóa khi stop. Phiên 25' ≈ 80-110KB |
| `sessionHistory` | `SessionData[]` | Tối đa 100 phiên **kèm nguyên mảng samples** | session-manager ghi; History/Diagnostic/AI đọc | **Key lớn nhất: ≈8-11MB → nguy cơ chạm quota 10MB** |
| `badges` | `Record<string, boolean>` | 10 huy hiệu tích lũy | Merge cuối phiên | ~300B |
| `fp_analytics_events` | `AnalyticsEvent[]` | Ring buffer 200 sự kiện + lỗi runtime | track() từ background+popup | Privacy-first, không URL/PII |
| `fp_install_id` | `string` | ID ẩn danh đếm thiết bị | analytics | Không bị xóa bởi clearAnalytics |
| `settings`, `allowedDomains` | — | — | **Dead code — không nơi nào gọi** | Nên xóa hoặc dùng thật |
| `focusproof_web_user` | `unknown` | Payload từ web-bridge | Web ghi, **không ai đọc**, không validate | Lỗ hổng nhỏ + dead code |

**Server (`server/index.js`) — file JSON, chưa phải DB thật:**
- `data/certificates.json`: registry chứng chỉ `{id, hash, score, grade, date, task, registeredAt, signature}` — ký HMAC-SHA-256, đọc bởi `/verify/:id`. Ghi đè toàn file mỗi lần lưu (không atomic).
- `data/events.jsonl`: analytics append-only, **không có endpoint đọc**.

**3 giới hạn cần nói thật khi bị hỏi:** quota 10MB; gỡ extension = mất sạch; không đồng bộ đa thiết bị (server registry là bước đầu khắc phục).

---

## 5. Chrome Web Store — nộp được chưa?

**Kết luận: CHƯA — còn 2 blocker bắt buộc, nhưng chỉ cần ~2-3 giờ để gỡ (chưa tính các fix bảo mật nên làm trước khi nộp).**

| Hạng mục | Trạng thái |
|---|---|
| Tên + mô tả + single purpose | ✅ Sẵn trong docs/CHROME_WEBSTORE_SUBMISSION.md |
| Icon đủ size (16/48/128) | ✅ Có, đã verify pixel |
| Tài khoản dev + phí $5 | ✅ Item đã tồn tại trên Dashboard (từng bị reject, đã fix) |
| Permission justifications | ✅ Đủ 7 quyền |
| Data usage disclosure | ✅ Soạn sẵn, khớp certification |
| **Screenshot 1280×800** | ❌ **Chưa có file nào — bắt buộc tối thiểu 1** |
| **Privacy policy URL sống** | ❌ **focusproof.com là trang parking Namecheap, /privacy 404.** Nội dung đã soạn nhưng còn placeholder [NGÀY]/[EMAIL], chưa host |
| Zip nộp | ⚠️ Bản zip ở root cũ ~2 tháng, chứa WASM lặp + file rác, thiếu mọi cải tiến — phải đóng gói lại từ dist mới, version 1.0.1 |

**Rủi ro reject sau khi gỡ blocker (theo mức độ):** (1) keylogger typedContent gửi OpenAI không có consent UI — phải sửa; (2) thiếu màn hình Prominent Disclosure + Consent trong extension (bắt buộc theo user-data policy, Google siết thực thi từ 01/08/2026); (3) `externally_connectable` chứa localhost + wildcard vercel.app; (4) quyền `tabs` có thể thừa khi đã có `<all_urls>` (tạo cảnh báo "Read your browsing history" rất nặng); (5) `<all_urls>` + content script tĩnh → in-depth review 1-3 tuần.

**Khuyến nghị chế độ phát hành:** Unlisted (review y hệt public, không cần marketing, chia sẻ link cho giám khảo). Nộp SỚM vì review 1-3 tuần; song song chuẩn bị demo load-unpacked.

---

## 6. Lộ trình hành động ưu tiên

### P0 — Trước ngày thi (tổng ~2-3 ngày công)
1. **[1h] Thu hồi + xoay key OpenAI**; xóa `VITE_OPENAI_API_KEY` khỏi .env; thêm bước grep `sk-|T3BlbkFJ` vào script build để chặn tái diễn.
2. **[2-3h] Deploy server/** lên Render/Railway/Fly free tier: `CERT_SIGNING_SECRET` ngẫu nhiên ≥32 ký tự, key OpenAI MỚI, `CORS_ORIGIN=chrome-extension://<id>`, `trust proxy`. Xác nhận `/api/health` sống.
3. **[1-1.5h] Rebuild extension** với .env chỉ chứa 3 biến `VITE_AI_PROXY_URL` + `VITE_VERIFY_BASE_URL` + `VITE_ANALYTICS_URL` trỏ URL deploy → **toàn bộ câu chuyện backend/DB/QR-verify/analytics từ "code chết" thành demo sống**. Smoke test trọn vòng: chạy phiên → PDF → quét QR → trang /verify hiện bản ghi server ký. Đây là hành động ăn điểm nhất cho tiêu chí 4, 5, 8.
4. **[1-2h] Fix lỗi kéo widget** (P0-2, 1 dòng) + rebuild.
5. **[2-3h] Fix Strict Mode** (phạt khi đổi tab) + **fix clobber outside-chrome** (P0-3, P0-4) + test.
6. **[2-3h] Vá keylogger**: bỏ qua `input[type=password]`/autocomplete nhạy cảm; mặc định TẮT gửi typedContent, thêm opt-in.
7. **[2-3h] Màn hình Consent/Prominent Disclosure** trước phiên đầu: liệt kê chính xác dữ liệu thu thập, camera opt-in riêng — vừa là yêu cầu cứng Web Store vừa là lá chắn phản biện privacy.
8. **[2-3h] Đo CPU/RAM thật** phiên 60-90 phút bằng Chrome Task Manager, chụp ảnh, đưa số vào slide — yêu cầu trực tiếp của giám khảo vòng trước.
9. **[2-3h] Gỡ blocker Web Store**: host privacy policy (GitHub Pages là nhanh nhất), chụp 3-5 screenshot 1280×800, đóng gói zip 1.0.1 từ dist sạch, dọn externally_connectable.
10. **[1-2h] CI tối thiểu**: `.github/workflows/ci.yml` chạy lint + type-check + vitest + build; thêm `npm run package`. Lấp chữ "CI/CD" của tiêu chí 9 với chi phí thấp nhất.

### P1 — Nếu còn thời gian (~1-2 ngày)
- SQLite thật cho server (better-sqlite3, interface store đã sẵn — chỉ viết lại 3 hàm) → tiêu chí 5 có "DB engine thật".
- Backup/restore JSON trong extension (xuất + nhập, validate schema).
- Siết `POST /api/certificates` (Origin chrome-extension:// + token per-install).
- Phủ error logging cho offscreen + content script; panel lỗi chi tiết trong DiagnosticDashboard.
- Onboarding first-run 3 slide; hiện lỗi khi START_SESSION thất bại.
- Thu hẹp quyền: xóa content_scripts tĩnh, inject runtime qua ensureContentScript() có sẵn; cân nhắc bỏ quyền `tabs`.
- Xử lý fullscreen cho widget (re-append vào fullscreenElement).
- Bỏ WASM no-SIMD (Chrome ≥91 luôn có SIMD) → dist còn ~13MB.
- Sau khi làm P0 + phần lớn P1, điểm ước lượng có thể đạt **~78-84/100**.

---

## 7. Hướng "lớp học" — nghiên cứu & thiết kế đề xuất

### Khoảng trống thị trường (có dẫn chứng)
- Nhóm classroom management (GoGuardian ~9.5-72 USD/HS/năm, Hapara, LanSchool ~2.99 USD) = giám sát TỪ TRÊN XUỐNG, không đo tập trung thật. Nhóm focus app cá nhân (Forest, Session, Cold Turkey) = không có chiều lớp học. **Không sản phẩm nào có "proof" + báo cáo cho giảng viên** → FocusProof đứng đúng giao điểm còn trống.
- Việt Nam: LMS (Moodle-based, PHX Smart School...) quản lý nội dung; Azota (2.4 triệu USD vốn) chống gian lận LÚC THI. **Chưa ai làm "bằng chứng nỗ lực LÚC HỌC"** — câu định vị: *"Azota chứng minh bạn không gian lận lúc thi; FocusProof chứng minh bạn có nỗ lực lúc học."*
- YPT (Hàn Quốc, 5-6.9 triệu người dùng) chứng minh nhu cầu "thi đua tập trung" trong giới trẻ châu Á là thật — nhưng YPT chỉ bấm giờ tự khai, không có bằng chứng khách quan.

### Kiến trúc đề xuất cho demo (P0 — làm được trước ngày thi)
1. **Đăng nhập Google** qua `chrome.identity.getAuthToken` (thêm permission `identity` + block `oauth2` vào manifest, cố định extension ID bằng trường `key`). Lưu ý kỹ thuật quan trọng: tham số `hd` chỉ là gợi ý UI, **backend phải verify claim `hd`/đuôi email bên trong id_token** (Google ký nên tin được); trường không dùng Workspace thì fallback kiểm tra đuôi email + `email_verified=true`.
2. **Mở rộng server/** với 4 bảng: `teachers`, `classes` (kèm **join_code 6 ký tự** — sinh viên tự tham gia, nhanh hơn tích hợp Classroom cho demo), `assignments` (phiên giảng viên giao: thời lượng, khung giờ, cấu hình tín hiệu), `session_reports` (điểm 3 tín hiệu, hạng, hash chứng chỉ). Extension chỉ POST điểm tổng hợp — **tuyệt đối không gửi frame ảnh**.
3. **Email report cho giảng viên qua Resend** (free 3.000 email/tháng, 100/ngày — SendGrid đã bỏ free plan, Mailgun chỉ 100/ngày sandbox): email HTML gồm tên SV, điểm, hạng, biểu đồ 3 tín hiệu, link verify QR. Gửi ngay khi phiên kết thúc → **khoảnh khắc "wow" trên sân khấu: mở hộp thư giảng viên thấy report đến sau vài giây**.
4. **Dashboard lớp học tối giản** (server/ render trang web): bảng sinh viên × phiên × điểm × hạng + trung bình lớp.
5. **Màn consent trước phiên có camera** — điều kiện sống còn để không bị xếp vào nhóm proctoring.

### Lộ trình sau thi (P1)
- Google Classroom REST API (miễn phí mọi edition): import roster, đăng "phiên tập trung" như coursework, trả điểm về gradebook. Cần OAuth verification khi publish nên không kịp trước thi.
- SSO Microsoft/Azure AD; báo cáo tuần tự động; Classroom add-on (cần trường có Education Plus).
- Hồ sơ tuân thủ: DPIA mẫu, privacy policy song ngữ dẫn chiếu NĐ 13/2023 + Luật Bảo vệ dữ liệu cá nhân 2026, cơ chế xóa dữ liệu theo yêu cầu.

### ⚠️ Vùng cấm phải tránh
**Không phát triển theo hướng proctoring/chống gian lận thi cử.** Bài học: Proctorio bị 27.000 chữ ký phản đối ở CUNY, ProctorU rò rỉ dữ liệu 440.000 người; EU AI Act (từ 2/2025) **cấm AI suy luận cảm xúc/mức độ chú ý của học sinh do tổ chức áp đặt**; án phạt GDPR đầu tiên của Thụy Điển kết luận consent của học sinh với nhà trường là "bị ép" nên vô hiệu. FocusProof an toàn vì: sinh viên TỰ khởi động phiên (opt-in), chỉ phát hiện có/không khuôn mặt (không đọc cảm xúc), xử lý 100% local, có chế độ no-camera. Giữ đúng định vị "công cụ tự chứng minh tích cực do sinh viên sở hữu".

---

## 8. Luận điểm thuyết trình + kịch bản phản biện

1. **Khiêm tốn khoa học**: FocusProof đo "điều kiện và hành vi tập trung" (hiện diện + tương tác + đúng tab), KHÔNG tuyên bố đọc trạng thái nhận thức. 3 tín hiệu độc lập = triangulation: giả 1 tín hiệu thì dễ, giả cả 3 cùng lúc thì gần như phải... thật sự ngồi học.
2. **Khi bị hỏi "webcam attention tracking có đáng tin không?"** — trả lời 4 bước: (a) Thừa nhận: nghiên cứu cho thấy đọc trạng thái chú ý từ mặt chỉ trên ngẫu nhiên 14-20% (F1~0.45), EU đã cấm emotion recognition trong giáo dục — chúng tôi đồng ý; (b) Phân biệt: chúng tôi không đọc cảm xúc, chỉ xác nhận 3 sự kiện khách quan; (c) Dẫn chứng: nghiên cứu khả thi TU Delft (IUI 2018) kết luận face-presence là hướng đơn giản-bền vững nhất cho quy mô lớn; (d) Đóng khung: điểm S-F là "bằng chứng về nỗ lực", không phải phán quyết về trí óc.
3. **Privacy-first by design**: không frame video nào rời máy, chuẩn bị 1 slide "Chúng tôi KHÔNG làm gì" (không ghi hình, không upload, không đọc cảm xúc, không bật từ xa).
4. **Số liệu thị trường cho slide**: EdTech VN ~1 tỷ USD (2024) → ~3 tỷ USD (2033); 2,3 triệu sinh viên; YPT 5+ triệu người dùng chứng minh nhu cầu.
5. **Demo phản biện mạnh nhất**: cố tình gian lận trước giám khảo (dán ảnh trước webcam, treo chuột) và cho thấy 2 tín hiệu còn lại kéo điểm xuống.
6. **Kịch bản demo**: phiên thật → widget realtime → kết thúc → điểm + AI Insight (offline fallback nếu mất mạng) → PDF → **quét QR mở trang /verify do server ký** → (nếu kịp) email report đến hộp thư giảng viên. Luôn có video backup.
