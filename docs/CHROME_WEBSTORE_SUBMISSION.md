# Chrome Web Store — Hồ sơ Submit FocusProof v1.0.0

> Tài liệu này chứa TẤT CẢ nội dung cần copy vào Chrome Web Store Developer Dashboard.
> Tạo sau khi fix lỗi "Blue Argon — Remotely hosted code".

---

## 0. TRẠNG THÁI BUILD

- ✅ Lỗi remote code (Blue Argon) đã fix — 3 URL trong jsPDF → `about:blank`
- ✅ KHÔNG có API key trong build (an toàn cho public store)
- ✅ 184/184 unit tests pass
- ✅ File submit: `focusproof-store-v1.0.0.zip` (13.7 MB)
- ⚠️ AI Analysis: cần user tự thêm key (BYOK) hoặc dev sau — core 95% tính năng chạy bình thường

---

## 1. STORE LISTING — Thông tin cơ bản

**Tên (Name):**
```
FocusProof — Chứng chỉ Tập trung Thông minh
```

**Mô tả ngắn (Summary, ≤132 ký tự):**
```
Đo lường & chứng minh sự tập trung khi học/làm qua 3 tín hiệu. Cấp chứng chỉ PDF có QR + SHA-256. 100% xử lý cục bộ.
```

**Category:** `Productivity` (Năng suất)

**Language:** Tiếng Việt (primary) + English

---

## 2. MÔ TẢ CHI TIẾT (Detailed description)

```
FocusProof giúp bạn ĐO LƯỜNG, GHI NHẬN và CHỨNG MINH mức độ tập trung
trong mỗi phiên học tập hoặc làm việc một cách khách quan.

🎯 LÕI CÔNG NGHỆ — 3-SIGNAL DETECTION
• Nhận diện khuôn mặt (MediaPipe BlazeFace) — chạy 100% trong trình duyệt,
  KHÔNG lưu ảnh/video
• Theo dõi hoạt động chuột & bàn phím (hỗ trợ gõ tiếng Việt)
• Phân tích Tab/Domain theo mục tiêu phiên (Học/Làm/Code/Video)

📜 KẾT QUẢ MỖI PHIÊN
• Focus Score 0–100 chấm theo mục tiêu
• Chứng chỉ PDF 2 trang có mã QR + chữ ký số SHA-256 — xác thực được,
  không thể giả mạo
• Lịch sử 7 ngày + Heatmap + Export CSV

🔒 RIÊNG TƯ TUYỆT ĐỐI (PRIVACY-FIRST)
• Toàn bộ AI nhận diện chạy CỤC BỘ trong trình duyệt
• KHÔNG chụp màn hình, KHÔNG keylogger, KHÔNG upload dữ liệu
• Chỉ đọc domain (không đọc nội dung trang)

🎮 ĐỘNG LỰC
• Hệ thống Streak + 10 huy hiệu thành tích
• Floating Widget realtime với countdown
• Quick Test 3 phút cho người mới

⚙️ TÍNH NĂNG KHÁC
• 4 chế độ mục tiêu + Custom Domain Whitelist
• Camera-Off Mode (chạy không cần webcam)
• Strict Mode chống mở tab linh tinh
• Dark Theme (system/light/dark)
• Voice Note Summary

Phù hợp cho: sinh viên, freelancer, lập trình viên, người làm việc từ xa
muốn đo lường và chứng minh năng suất một cách khách quan.

Lưu ý: Tính năng AI Insight (phân tích bằng GPT-4o-mini) yêu cầu người dùng
cấu hình API key OpenAI riêng trong phần Cài đặt (tùy chọn). Mọi tính năng
cốt lõi hoạt động đầy đủ mà không cần AI.
```

---

## 3. SINGLE PURPOSE (Mục đích duy nhất) — BẮT BUỘC

```
FocusProof đo lường và chứng minh sự tập trung trong phiên học tập/làm việc
thông qua ba tín hiệu (nhận diện khuôn mặt cục bộ, hoạt động chuột/bàn phím,
tab/domain), sau đó cấp chứng chỉ PDF có mã QR và chữ ký SHA-256 để xác thực.
```

---

## 4. PERMISSION JUSTIFICATIONS — Điền chính xác vào Dashboard

| Permission | Justification (copy nguyên) |
|---|---|
| `tabs` | Đọc URL/domain của tab đang hoạt động để đánh giá mức độ phù hợp với mục tiêu phiên (ví dụ: phiên Lập trình chỉ cho phép github.com). KHÔNG đọc nội dung trang. |
| `activeTab` | Truy cập tab hiện tại để hiển thị widget theo dõi tập trung realtime. |
| `storage` | Lưu lịch sử phiên, cài đặt, huy hiệu, streak vào chrome.storage.local trên máy người dùng. Không đồng bộ lên server. |
| `offscreen` | Tạo Offscreen Document để chạy camera và mô hình MediaPipe BlazeFace nhận diện khuôn mặt CỤC BỘ. Bắt buộc với Manifest V3 vì Service Worker không truy cập được camera. |
| `notifications` | Hiển thị thông báo hệ thống khi người dùng mất tập trung (mất mặt khỏi camera, idle, sai tab). |
| `scripting` | Inject content script để hiển thị Floating Widget theo dõi realtime trên trang người dùng đang học/làm. |
| `host_permissions: <all_urls>` | Người dùng có thể học/làm trên BẤT KỲ website nào (Google Docs, Notion, GitHub, Coursera...). Widget cần inject trên mọi domain để theo dõi. Extension CHỈ đọc domain (hostname), KHÔNG đọc nội dung, KHÔNG ghi keystroke, KHÔNG chụp màn hình. |

---

## 5. DATA USAGE / PRIVACY DISCLOSURE — Khai báo trong Dashboard

**Dữ liệu KHÔNG thu thập:**
- ❌ Thông tin định danh cá nhân (PII)
- ❌ Thông tin sức khỏe
- ❌ Thông tin tài chính
- ❌ Vị trí địa lý
- ❌ Lịch sử duyệt web / nội dung trang
- ❌ Nội dung gõ phím (chỉ đếm số sự kiện, không đọc nội dung)

**Dữ liệu xử lý CỤC BỘ (không rời máy người dùng):**
- ✅ Khung hình webcam — xử lý nhận diện trong RAM, xóa ngay sau ~10ms, KHÔNG lưu
- ✅ Số lượng sự kiện chuột/bàn phím (chỉ đếm, không nội dung)
- ✅ Domain của tab (chỉ hostname, không full URL)
- ✅ Lịch sử phiên, settings — lưu chrome.storage.local

**Dữ liệu gửi đi (CHỈ khi người dùng chủ động bật AI Analysis):**
- ⚠️ Số liệu thống kê tổng hợp phiên (Focus Score, thời lượng, % tuân thủ, top domains)
  gửi tới OpenAI API qua key do CHÍNH NGƯỜI DÙNG cấu hình. KHÔNG gửi ảnh/video/keystroke.

**Cam kết:**
- KHÔNG bán dữ liệu
- KHÔNG dùng dữ liệu cho mục đích ngoài chức năng chính
- KHÔNG chuyển dữ liệu cho bên thứ ba (trừ OpenAI khi user opt-in, qua key của user)

→ Tick: "I do not sell or transfer user data to third parties, outside of the approved use cases"
→ Tick: "I do not use or transfer user data for purposes unrelated to my item's single purpose"
→ Tick: "I do not use or transfer user data to determine creditworthiness or for lending purposes"

---

## 6. PRIVACY POLICY — Host thành URL public

> Chrome BẮT BUỘC có Privacy Policy URL. Host nội dung dưới đây tại:
> - `https://focusproof.com/privacy` (nếu đã deploy web), HOẶC
> - GitHub Pages / Notion public page / Google Sites
> Sau đó dán URL vào ô "Privacy policy URL" trong Dashboard.

```
CHÍNH SÁCH QUYỀN RIÊNG TƯ — FOCUSPROOF
Cập nhật lần cuối: [NGÀY]

1. NGUYÊN TẮC CỐT LÕI
FocusProof được thiết kế theo nguyên tắc Privacy-by-Architecture: dữ liệu
nhạy cảm không bao giờ rời khỏi trình duyệt của bạn.

2. DỮ LIỆU CHÚNG TÔI XỬ LÝ
a) Webcam: Khung hình được xử lý nhận diện khuôn mặt CỤC BỘ bằng MediaPipe
   BlazeFace ngay trong trình duyệt. Khung hình bị xóa khỏi bộ nhớ trong
   ~10ms. KHÔNG lưu trữ, KHÔNG tải lên bất kỳ máy chủ nào.
b) Hoạt động chuột/bàn phím: Chỉ ĐẾM số lượng sự kiện để xác định trạng thái
   hoạt động. KHÔNG ghi lại nội dung phím gõ.
c) Tab/Domain: Chỉ đọc tên miền (hostname) để đánh giá mục tiêu phiên.
   KHÔNG đọc đường dẫn, tham số, hay nội dung trang.
d) Lịch sử phiên: Lưu cục bộ trong chrome.storage.local trên thiết bị bạn.

3. DỮ LIỆU GỬI ĐI
Tính năng AI Analysis là TÙY CHỌN và phải được bạn chủ động kích hoạt.
Khi đó, chỉ SỐ LIỆU THỐNG KÊ TỔNG HỢP (điểm số, thời lượng, % tuân thủ,
tên domain) được gửi tới OpenAI API thông qua API key do CHÍNH BẠN cấu hình.
KHÔNG bao giờ gửi ảnh, video, hay nội dung gõ phím.

4. CHIA SẺ DỮ LIỆU
Chúng tôi KHÔNG bán, KHÔNG cho thuê, KHÔNG chia sẻ dữ liệu của bạn với bên
thứ ba (ngoại trừ OpenAI khi bạn tự bật AI Analysis bằng key của bạn).

5. QUYỀN CỦA BẠN
Bạn có thể xóa toàn bộ dữ liệu bất kỳ lúc nào bằng cách gỡ extension hoặc
xóa lịch sử trong phần Cài đặt. Dữ liệu là của bạn và nằm trên máy bạn.

6. LIÊN HỆ
Email: [EMAIL CỦA BẠN]
```

---

## 7. SCREENSHOTS — Cần chuẩn bị (1280×800 hoặc 640×400)

Tối thiểu 1, khuyến nghị 3–5:
1. Popup Start Screen (chọn task + mode)
2. Floating Widget realtime trên trang đang học
3. Result Screen (Focus Score + Pie Chart)
4. PDF Certificate (QR + SHA-256)
5. History + Heatmap

→ Chụp bằng `Win + PrtScn`, lưu Pictures/Screenshots, crop về tỉ lệ 1280×800.

---

## 8. QUY TRÌNH SUBMIT — Step by step

1. Đăng nhập [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Chọn item **FocusProof** (mã: ddmmfekinihpcdffpogkjpjaamomcghf)
3. Tab **Package** → Upload `focusproof-store-v1.0.0.zip`
4. Tab **Store listing** → điền Name, Summary, Description, Category, Screenshots
5. Tab **Privacy practices**:
   - Single purpose → mục 3
   - Permission justifications → mục 4
   - Data usage → mục 5
   - Privacy policy URL → mục 6 (host trước thành URL)
6. Tăng version trong manifest nếu cần (1.0.0 → 1.0.1 nếu resubmit)
7. **Submit for review**
8. Chờ 1–7 ngày. Nếu reject → đọc mã vi phạm → fix → resubmit (KHÔNG tạo item mới)

---

## 9. NẾU BỊ REJECT LẦN NỮA

- Đọc kỹ "Mã tham chiếu vi phạm" (vd: Blue Argon, Yellow Magnesium...)
- Tra cứu: https://developer.chrome.com/docs/webstore/troubleshooting
- Lỗi remote code đã fix. Các lỗi tiềm năng còn lại:
  - Thiếu Privacy Policy URL → host mục 6
  - `<all_urls>` bị hỏi → giải trình bằng mục 4
  - Screenshots không đạt → chụp lại đúng kích thước
- Nếu chắc chắn đúng → bấm **Appeal** kèm giải thích rõ ràng

---

## 10. CHECKLIST CUỐI

```
□ Upload focusproof-store-v1.0.0.zip
□ Name + Summary + Description (mục 1, 2)
□ Single purpose (mục 3)
□ 7 permission justifications (mục 4)
□ Data usage disclosure (mục 5)
□ Privacy Policy đã host thành URL public (mục 6)
□ 3-5 screenshots 1280×800 (mục 7)
□ Category: Productivity
□ Submit for review
```
