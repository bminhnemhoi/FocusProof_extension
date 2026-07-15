# FocusProof – Giải trình Quyền & Bảo mật

Tài liệu chuẩn bị cho câu hỏi "Vì sao xin quyền `<all_urls>`?" ở vòng chung kết.

## 1. Vì sao cần host access rộng

FocusProof đo **mức độ tuân thủ mục tiêu theo tab/domain**. Đây là 1 trong 3 tín
hiệu chấm điểm (25%–40% trọng số). Muốn biết người dùng đang ở `docs.google.com`
(đúng mục tiêu) hay `facebook.com` (xao nhãng), extension **buộc phải đọc được URL
tab đang hoạt động trên bất kỳ trang nào** — không thể liệt kê trước danh sách
website mà người dùng sẽ mở. Đây là bản chất chức năng, không phải quyền thừa.

So sánh: các trình chặn web (BlockSite…) và tiện ích chấm công cũng dùng
`<all_urls>` vì cùng lý do.

## 2. Điều FocusProof KHÔNG làm (giảm lo ngại)

- **Không đọc nội dung trang.** Content script chỉ đếm số phím/click/scroll
  (con số thô) và đọc `location.hostname`. Không thu thập text, form, cookie.
  → Kiểm chứng: `src/content-script/` không hề gọi `document.body.innerText`,
  không đọc input, không dùng `chrome.runtime.getURL` để nạp tài nguyên vào trang.
- **Không lưu ảnh camera.** Offscreen chỉ trả `{ detected, confidence }`.
- **Không gửi dữ liệu ra ngoài** (mặc định). Toàn bộ lưu `chrome.storage.local`.
- **Chống XSS:** DOMPurify + CSP `script-src 'self' 'wasm-unsafe-eval'`.

## 3. Kế hoạch THU HẸP quyền (đã thiết kế, cần 1 lần smoke-test trên Chrome)

Có thể giảm bề mặt quyền theo 2 bước, giữ nguyên chức năng:

### Bước A — Bỏ content script khai báo tĩnh, chỉ inject khi có phiên
Hiện `manifest.json` khai báo `content_scripts: <all_urls>` → code chạy trên
**mọi trang, mọi lúc** kể cả khi không có phiên. Thực tế extension đã có sẵn
`ensureContentScript()` dùng `chrome.scripting.executeScript` (inject theo yêu
cầu) trong [session-manager.ts](../src/background/session-manager.ts) và
[background/index.ts](../src/background/index.ts). Vì vậy có thể:

```jsonc
// Bỏ khối "content_scripts" khai báo tĩnh.
// Giữ "scripting" + "activeTab"; chỉ inject widget khi phiên đang chạy.
```

Lợi ích: extension **không chạy bất kỳ code nào trên trang khi không đo phiên** —
đây là điểm cộng lớn về riêng tư & hiệu năng, và là câu trả lời mạnh cho giám khảo.

### Bước B — Thu gọn `web_accessible_resources`
WASM/model/fonts chỉ được nạp bởi **trang extension** (offscreen document, popup),
không phải bởi content script (đã kiểm chứng: không có `getURL` trong
`src/content-script/`). Trang extension truy cập tài nguyên đóng gói **không cần**
`web_accessible_resources`. Do đó có thể thu hẹp hoặc bỏ khối này.

> ⚠️ Cả 2 bước đổi hành vi runtime → cần load thử trên Chrome (bật 1 phiên có
> camera + chuyển tab) trước khi phát hành. Vì gần ngày thi, bản hiện tại giữ
> `<all_urls>` để đảm bảo demo ổn định; kế hoạch trên nằm trong lộ trình.

## 4. Vấn đề lộ API key — ĐÃ xử lý về mặt kiến trúc

XOR trong [api-key.ts](../src/utils/api-key.ts) chỉ là che mắt, **không** bảo mật.
Giải pháp đúng đã triển khai: gọi AI **qua backend proxy** (`VITE_AI_PROXY_URL`,
xem [server/](../server)) để key nằm ở server. Khi chưa có proxy/key, extension
tự dùng **engine phân tích offline** — không lộ gì và không gãy khi demo.

## 5. "Chữ ký SHA-256" — đã nói lại cho trung thực

SHA-256 là **dấu vân tay toàn vẹn** (đổi dữ liệu → đổi hash), không phải chữ ký số.
Đã: (a) đổi nhãn PDF từ "SHA-256 Verified" → "SHA-256 Integrity"; (b) thêm
`verifyIntegrity()` tự phát hiện dữ liệu bị sửa; (c) backend `/api/certificates`
ký HMAC-SHA-256 bằng khóa bí mật server + `/verify/:id` cho xác thực THẬT khi quét QR.
Xem [certificate-signing.ts](../src/utils/certificate-signing.ts).
