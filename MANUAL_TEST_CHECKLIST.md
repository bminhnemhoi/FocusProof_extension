# FocusProof – Manual Test Checklist

**Phiên bản**: Phase 4 – Testing, Polish & Optimization  
**Ngày tạo**: 17/04/2026  
**Mục tiêu**: Checklist manual test pass 100% (theo ke_hoach.md Phase 4)

> Đánh dấu ✅ khi pass, ❌ khi fail, ⏭️ khi skip (ghi lý do).

---

## 1. Extension Load & Khởi động

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 1.1 | Load unpacked | Chrome → `chrome://extensions` → Load unpacked `dist/` | Extension hiện, icon 128px, không lỗi console | ☐ |
| 1.2 | Mở Popup | Click icon extension | Popup hiện StartScreen, không blank | ☐ |
| 1.3 | Service Worker | Kiểm tra `chrome://extensions` → Inspect views | Service Worker active, không crash | ☐ |
| 1.4 | Rebuild từ đầu | `npm install` → `npm run build` | Build thành công, 0 errors | ☐ |

---

## 2. StartScreen & Session Configuration

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 2.1 | Task presets | Chọn từng mode: study, work, programming, video-lecture | Allowed domains tự cập nhật theo mode | ☐ |
| 2.2 | Custom task name | Nhập tên task có dấu tiếng Việt: "Viết báo cáo tốt nghiệp" | Tên hiển thị đúng, lưu vào session | ☐ |
| 2.3 | Allowed domains | Thêm/xóa domain tùy chỉnh | List cập nhật realtime | ☐ |
| 2.4 | Allow external apps | Toggle ON/OFF | Trạng thái lưu đúng vào config | ☐ |
| 2.5 | Strict Mode | Bật Strict Mode | Chỉ 1 tab được phép | ☐ |
| 2.6 | Camera toggle | Bật/tắt camera | Config `cameraEnabled` đúng | ☐ |
| 2.7 | Duration picker | Chọn thời lượng 1, 5, 25, 60 phút | `durationMinutes` đúng | ☐ |

---

## 3. Session Flow (Full Lifecycle)

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 3.1 | Start session (camera ON) | Bấm "Bắt đầu" với camera bật | Chrome xin quyền camera, session running | ☐ |
| 3.2 | Start session (camera OFF) | Bấm "Bắt đầu" với camera tắt | Session chạy ngay, Camera-Off Mode | ☐ |
| 3.3 | Deny camera | Bấm "Bắt đầu" → Deny camera permission | Session vẫn chạy (Camera-Off Mode), toast thông báo | ☐ |
| 3.4 | Sampling loop | Console log kiểm tra | Sample mỗi 6 giây, focusScore cập nhật | ☐ |
| 3.5 | Stop session | Bấm "Stop" hoặc chờ hết giờ | Session finalize, chuyển ResultScreen | ☐ |
| 3.6 | Auto-stop | Chạy session 1 phút, chờ hết | Tự stop, hiện ResultScreen | ☐ |
| 3.7 | Service Worker restart | `chrome://extensions` → Toggle OFF/ON extension | Session restore, sampling tiếp tục | ☐ |
| 3.8 | Double start | Bấm "Bắt đầu" 2 lần liên tiếp | Lần 2 bị chặn, báo "Session already running" | ☐ |

---

## 4. Floating Widget

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 4.1 | Widget hiển thị | Start session → mở tab web | Widget overlay xuất hiện (Shadow DOM) | ☐ |
| 4.2 | Realtime update | Gõ phím, di chuột | Focus score + 4 tín hiệu cập nhật | ☐ |
| 4.3 | Drag widget | Kéo thả widget | Widget di chuyển, giữ vị trí | ☐ |
| 4.4 | Minimize/expand | Click nút minimize | Thu nhỏ thành 48px circle, click lại expand | ☐ |
| 4.5 | Timer countdown | Chờ vài sample | Thời gian còn lại giảm đúng | ☐ |
| 4.6 | Widget cleanup | Stop session | Widget biến mất hoàn toàn | ☐ |
| 4.7 | Widget error recovery | Inspect widget → xóa DOM → chờ sample | Widget tự re-create hoặc không crash | ☐ |

---

## 5. Tab & Screen Tracking

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 5.1 | Tab switch (allowed) | Chuyển sang tab allowed domain | goalCompliant = true, widget xanh | ☐ |
| 5.2 | Tab switch (not allowed) | Chuyển sang tab facebook.com | goalCompliant = false, widget đỏ flash | ☐ |
| 5.3 | Leave Chrome | Alt+Tab sang app khác | `__outside_chrome__`, widget đỏ (nếu external OFF) | ☐ |
| 5.4 | Return to Chrome | Alt+Tab quay lại Chrome | Phát hiện ngay, cập nhật URL | ☐ |
| 5.5 | Many tab switches | Chuyển 10+ tab liên tục | Không crash, không memory leak | ☐ |
| 5.6 | Strict Mode violation | Bật Strict Mode → mở tab mới | Đánh dấu vi phạm | ☐ |
| 5.7 | Allow external apps ON | Toggle ON → rời Chrome | goalCompliant = true | ☐ |
| 5.8 | Allow external apps OFF | Toggle OFF → rời Chrome | goalCompliant = false, alert | ☐ |

---

## 6. Alert System

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 6.1 | Face not detected | Che camera > 8 giây | Widget rung + toast "Nhìn vào màn hình!" | ☐ |
| 6.2 | Idle detection | Không hoạt động > 25 giây | Cảnh báo idle trên widget | ☐ |
| 6.3 | Goal violation alert | Chuyển tab không allowed | Flash đỏ + toast trên widget | ☐ |
| 6.4 | Outside Chrome alert | Rời Chrome (external OFF) | Widget đỏ + notification | ☐ |
| 6.5 | Alert count | Tạo nhiều alert → check Popup | Alert count tăng đúng | ☐ |

---

## 7. PDF Certificate (Dynamic Import)

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 7.1 | Loading state | Bấm "Xuất chứng chỉ PDF" | Button hiện "🔄 Đang tạo PDF...", disabled | ☐ |
| 7.2 | Lazy loading | Network tab → bấm PDF lần đầu | Chunk `certificate-*.js` load lúc click (không trước đó) | ☐ |
| 7.3 | PDF download | Chờ xong | File PDF tải xuống, 2 trang A4 landscape | ☐ |
| 7.4 | PDF content page 1 | Mở PDF | Score circle, task name tiếng Việt đúng, top domains, hash, QR | ☐ |
| 7.5 | PDF content page 2 | Mở PDF trang 2 | AI analysis (nếu có), recommendations | ☐ |
| 7.6 | PDF without AI | Bấm PDF trước khi phân tích AI | Trang 2 hiện "Chưa có phân tích AI" hoặc bỏ qua | ☐ |
| 7.7 | PDF error handling | Ngắt mạng → bấm PDF | Hiện thông báo lỗi đỏ, button re-enable | ☐ |
| 7.8 | QR code in PDF | Mở PDF → zoom QR | QR scannable, chứa session hash | ☐ |
| 7.9 | Watermark | Kiểm tra PDF | "FocusProof Certified • SHA-256 Verified" | ☐ |
| 7.10 | Task name dấu TV | Task "Ôn thi đại học" → PDF | Hiển thị đúng dấu tiếng Việt | ☐ |
| 7.11 | UI không bị block | Trong lúc tạo PDF, thử scroll popup | UI vẫn responsive (async generation) | ☐ |

---

## 8. AI Analysis (Dynamic Import)

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 8.1 | Loading state | Bấm "Phân tích AI" | Button hiện "🔄 Đang phân tích...", disabled | ☐ |
| 8.2 | Lazy loading | Network tab → bấm AI lần đầu | Chunk `ai-analysis-*.js` load lúc click | ☐ |
| 8.3 | AI result display | Chờ kết quả | Summary VN + EN, pattern, recommendations | ☐ |
| 8.4 | AI with voice note | Ghi voice → bấm AI | Voice text được gửi cho GPT, kết quả phản ánh | ☐ |
| 8.5 | AI error (no API key) | Không set API key → bấm AI | Error message hiển thị, không crash | ☐ |
| 8.6 | AI error (network) | Ngắt mạng → bấm AI | Error "Lỗi phân tích AI", button re-enable | ☐ |
| 8.7 | AI disabled after success | Bấm AI thành công | Button đổi "✅ Đã phân tích", disabled | ☐ |

---

## 9. Voice Note

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 9.1 | Start recording | Bấm "🎙️ Ghi âm tóm tắt" | Button đổi thành "⏹ Dừng ghi (tối đa 30s)" | ☐ |
| 9.2 | Voice transcript | Nói vài câu → dừng | Text hiện trong "Nội dung:" | ☐ |
| 9.3 | Auto-stop 30s | Nói liên tục > 30 giây | Tự dừng sau 30s | ☐ |
| 9.4 | Deny microphone | Deny quyền micro | Toast "Không thể ghi âm do quyền micro bị chặn" | ☐ |
| 9.5 | Browser không hỗ trợ | Test trên browser cũ/không có Speech API | Hiện "Trình duyệt không hỗ trợ" | ☐ |

---

## 10. Dark Theme & Accessibility

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 10.1 | System dark mode | OS đặt dark mode → mở Popup | Popup tự chuyển dark theme | ☐ |
| 10.2 | Manual theme toggle | Bấm nút 🌙/☀️/💻 | Chuyển dark → light → system | ☐ |
| 10.3 | Dark theme colors | Kiểm tra dark mode | Background #0f172a, text #f1f5f9, primary #818cf8 | ☐ |
| 10.4 | Light theme override | Chọn ☀️ khi OS dark | Popup hiện light theme | ☐ |
| 10.5 | aria-live regions | Inspect DOM | `aria-live="polite"` trên main, voice section, AI section | ☐ |
| 10.6 | aria-label buttons | Inspect buttons | PDF button có `aria-label="Xuất chứng chỉ PDF"` | ☐ |
| 10.7 | role attributes | Inspect DOM | `role="banner"` header, `role="main"` main, `role="alert"` errors | ☐ |
| 10.8 | Keyboard navigation | Tab qua các button | Focus visible, tất cả interactive elements reachable | ☐ |
| 10.9 | Screen reader | NVDA/VoiceOver → navigate popup | Đọc đúng labels, live regions announce changes | ☐ |

---

## 11. Error Boundary & Graceful Degradation

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 11.1 | Error Boundary UI | Inject throw trong component → reload | Hiện fallback "Đã xảy ra lỗi", nút "Thử lại" | ☐ |
| 11.2 | Error Boundary reset | Bấm "Thử lại" | App re-render bình thường | ☐ |
| 11.3 | doSample survives error | Inject lỗi chrome.tabs.sendMessage | Session tiếp tục, console log error | ☐ |
| 11.4 | Widget creation failure | Block Shadow DOM → start session | Không crash, session vẫn chạy | ☐ |
| 11.5 | Storage failure | Mock storage.set reject | Session vẫn chạy, log error | ☐ |

---

## 12. Gamification & Badges

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 12.1 | Badge earning | Session score ≥ 90, ≥ 30 phút | Badge "Tập trung cao" earned | ☐ |
| 12.2 | Badge persist | Đạt badge → close extension → reopen | Badge vẫn hiện trong storage | ☐ |
| 12.3 | Badge display | Đạt ≥ 1 badge → ResultScreen | Badges hiện trong "🏆 Huy hiệu đạt được" | ☐ |
| 12.4 | No badge | Session score < threshold | Không hiện section badges | ☐ |

---

## 13. Session Hash & QR Code

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 13.1 | Hash generation | Stop session → check ResultScreen | SHA-256 hash hiển thị (16 ký tự + ...) | ☐ |
| 13.2 | Hash deterministic | Cùng session data → generate 2 lần | Cùng hash | ☐ |
| 13.3 | QR in PDF | Xuất PDF → scan QR | QR chứa đúng hash payload | ☐ |

---

## 14. Performance & Code-Splitting

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 14.1 | Main bundle size | `npx vite build` → check output | Main HTML chunk < 250KB (không chứa jsPDF) | ☐ |
| 14.2 | Certificate chunk | Build output | `certificate-*.js` ≈ 388KB (tách riêng) | ☐ |
| 14.3 | AI chunk | Build output | `ai-analysis-*.js` ≈ 3.5KB (tách riêng) | ☐ |
| 14.4 | Popup load time | Mở popup lần đầu | < 500ms, không load certificate/AI chunk | ☐ |
| 14.5 | PDF click load | Network tab → bấm PDF | Chunk load lúc click, UI hiện loading | ☐ |
| 14.6 | Long session | Chạy session 30+ phút | Không memory leak, widget smooth | ☐ |

---

## 15. Edge Cases

| # | Test Case | Bước thực hiện | Kết quả mong đợi | Status |
|---|-----------|---------------|-------------------|--------|
| 15.1 | chrome:// pages | Start session → navigate chrome://settings | Content script không inject, không crash | ☐ |
| 15.2 | New tab page | Chuyển sang new tab | Graceful handling (no URL) | ☐ |
| 15.3 | Tab close during session | Đóng tab đang tracking | Session tiếp tục trên tab mới | ☐ |
| 15.4 | All windows closed | Đóng tất cả window Chrome | Service Worker survive, restore on re-open | ☐ |
| 15.5 | Extension update | Simulate extension reload | Session restore hoạt động | ☐ |
| 15.6 | Multiple quick starts/stops | Start → Stop → Start → Stop nhanh | Không race condition, state clean | ☐ |
| 15.7 | Very short session (< 6s) | Start → Stop ngay | Không crash, có thể 0 samples | ☐ |
| 15.8 | Incognito mode | Cho phép incognito → test | Extension hoạt động (nếu enable) | ☐ |

---

## Tổng kết

| Mục | Số test case | Pass | Fail | Skip |
|-----|-------------|------|------|------|
| 1. Load & Khởi động | 4 | | | |
| 2. StartScreen | 7 | | | |
| 3. Session Flow | 8 | | | |
| 4. Floating Widget | 7 | | | |
| 5. Tab & Screen Tracking | 8 | | | |
| 6. Alert System | 5 | | | |
| 7. PDF Certificate | 11 | | | |
| 8. AI Analysis | 7 | | | |
| 9. Voice Note | 5 | | | |
| 10. Dark Theme & A11y | 9 | | | |
| 11. Error Boundary | 5 | | | |
| 12. Gamification | 4 | | | |
| 13. Hash & QR | 3 | | | |
| 14. Performance | 6 | | | |
| 15. Edge Cases | 8 | | | |
| **TỔNG** | **97** | | | |

**Tiêu chí pass**: ≥ 95/97 pass (≥ 97.9%), 0 critical fails.
