**FOCUSPROOF**  
**Chứng chỉ Tập trung Thông minh & Xác thực**  
**Mô tả dự án hoàn chỉnh – Tài liệu xây dựng lại từ đầu**  
**(Phiên bản Final – Hoàn thiện nhất sau tất cả trao đổi)**

### 1. TỔNG QUAN DỰ ÁN

**FocusProof** là một **Chrome Extension (Manifest V3)** giúp người dùng đo lường, ghi nhận và chứng minh mức độ tập trung trong các phiên làm việc hoặc học tập một cách khách quan, chính xác và dễ chia sẻ.  

Sản phẩm kết hợp **ba nguồn tín hiệu thời gian thực**:

- Nhận diện khuôn mặt qua webcam (xử lý cục bộ).  
- Theo dõi hoạt động bàn phím, chuột, cuộn trang (Activity Tracking).  
- Theo dõi tab, domain và trạng thái màn hình realtime (Tab & Screen Tracking).  

Tất cả dữ liệu được xử lý **100% cục bộ** trên máy người dùng. Kết quả phiên làm việc được tổng hợp thành **chứng chỉ PDF 2 trang chuyên nghiệp** kèm phân tích trí tuệ nhân tạo (song ngữ Việt – Anh), mã QR tự xác thực, watermark chống giả mạo và lịch sử chi tiết.

**Mục tiêu cốt lõi:**  
- Giúp người dùng tự đánh giá và cải thiện khả năng tập trung khoa học.  
- Cung cấp bằng chứng khách quan (chứng chỉ có thể xác thực).  
- Đảm bảo tính chính xác cao nhờ đánh giá theo mục tiêu cá nhân và chống gian lận.  
- Bảo vệ tối đa quyền riêng tư.

### 2. TÍNH NĂNG CHÍNH

#### 2.1 Hệ thống Phát hiện & Chống gian lận (Core Engine)

- **Face Detection**: MediaPipe BlazeFace (WASM local) – chỉ phát hiện sự hiện diện khuôn mặt (boolean + confidence score), không lưu ảnh, không nhận diện danh tính.

- **Activity Tracking**: Theo dõi bàn phím (IME tiếng Việt đầy đủ), chuột (di chuyển, click), cuộn trang, paste/drop và idle. Tính theo cửa sổ sampling 6 giây.

- **Tab & Screen Tracking (Realtime Screen Activity)**:  
  - Theo dõi **tab chính** (tab bắt đầu session) và **tab đang hoạt động** hiện tại.  
  - Theo dõi **domain/URL realtime** trong Chrome qua `chrome.tabs.onActivated` và `chrome.tabs.onUpdated`.  
  - Khi rời khỏi Chrome → phát hiện ngay qua `chrome.windows.onFocusChanged` → chuyển trạng thái sang “__outside_chrome__”.  
  - **Giới hạn kỹ thuật**: Không thể biết chính xác tên ứng dụng ngoài Chrome.

- **Goal-based Evaluation – Hàm isGoalCompliant()**:  
  - Người dùng chọn SessionMode trong StartScreen.  
  - Cấu hình bổ sung: `customAllowedDomains: string[]` (user tự thêm) và `customExternalRule?: boolean | null` (override toggle).  
  - **Bảng quy tắc mặc định theo loại mục tiêu** (định nghĩa trong `types.ts`):  
    ```ts
    export const DEFAULT_GOAL_DOMAIN_RULES: Record<SessionMode, string[]> = {
      'study': ['docs.google.com', 'drive.google.com', 'notion.so', 'evernote.com'],
      'work': ['docs.google.com', 'drive.google.com', 'notion.so'],
      'programming': ['github.com', 'gitlab.com', 'localhost', 'vscode.dev', 'stackblitz.com'],
      'video-lecture': ['youtube.com', 'coursera.org', 'udemy.com', 'zoom.us'],
    };

    export const DEFAULT_GOAL_EXTERNAL_APP_RULE: Record<SessionMode, boolean> = {
      'study': true,
      'work': true,
      'programming': false,
      'video-lecture': false,
    };
    ```
  - **Hàm isGoalCompliant()** (định nghĩa trong `goal-evaluator.ts`):  
    ```ts
    function isGoalCompliant(currentState: string, config: GoalConfig): boolean {
      if (currentState === '__outside_chrome__') {
        return config.customExternalRule !== undefined && config.customExternalRule !== null
          ? config.customExternalRule
          : DEFAULT_GOAL_EXTERNAL_APP_RULE[config.mode];
      }
      // Domain trong Chrome: ưu tiên custom list trước
      const allAllowed = [
        ...DEFAULT_GOAL_DOMAIN_RULES[config.mode],
        ...config.customAllowedDomains
      ];
      return allAllowed.some(allowed => 
        currentState.includes(allowed) || allowed.includes(currentState)
      );
    }
    ```

- **Camera-Off Mode**: Cho phép chạy session mà không cần camera. Trọng số tự động chuyển sang Activity 60% + Tab/Screen 40%.

- **Real-time Alert System**: Mất mặt > 8 giây → widget rung + thông báo “Nhìn vào màn hình!”. Không hoạt động > 25 giây → cảnh báo idle. Chuyển tab/domain không phù hợp → flash đỏ + toast. Rời khỏi Chrome (và toggle “Allow external apps” = OFF) → widget đỏ hoàn toàn + notification hệ thống.

- **Multi-Tab Guard (nâng cao)**:  
  - Người dùng chọn **danh sách allowed domains** (array string) ngay trong StartScreen.  
  - Danh sách lưu trong `chrome.storage.local` dưới key `allowedDomains: string[]`.  
  - **Match logic** (định nghĩa trong `goal-evaluator.ts`):  
    ```ts
    function isDomainAllowed(currentUrl: string, allowedDomains: string[]): boolean {
      if (!currentUrl) return false;
      const hostname = new URL(currentUrl).hostname.toLowerCase();
      return allowedDomains.some(allowed => {
        const a = allowed.toLowerCase();
        return hostname === a || hostname.endsWith('.' + a) || a.endsWith('.' + hostname);
      });
    }
    ```
  - Realtime check: Kiểm tra **ngay lập tức** trong `chrome.tabs.onActivated` và `chrome.tabs.onUpdated`.  
  - Chế độ “Strict Mode”: Chỉ cho phép 1 tab duy nhất.  
  - External apps: Toggle “Allow external apps” (không cho chọn cụ thể từng app vì Chrome Extension không hỗ trợ detect tên app ngoài).

#### 2.2 Trải nghiệm Người dùng (UX)

- **Floating Widget**: Overlay realtime trên mọi trang web (có thể thu nhỏ thành vòng tròn 48px). Hiển thị % tập trung (gradient), thời gian còn lại, 4 tín hiệu (Face – Activity – Tab/Screen – Alert).

- **Gamification**: Hệ thống streak và huy hiệu có tiêu chí rõ ràng, kiểm tra **chỉ cuối session** (trong `finalizeSession()`) và lưu trữ trong `chrome.storage.local` dưới key `badges: Record<string, boolean>`.

- **Diagnostic Dashboard**: Trang riêng kiểm tra camera, quyền truy cập và test alert theo goal.

- **Smart Task & Goal System**: Khi mở extension, popup hiển thị task presets + tùy chỉnh goal + chọn allowed domains + toggle “Allow external apps”.

#### 2.3 Kết quả & Phân tích

- **Chứng chỉ PDF 2 trang (A4 Landscape)**: Trang 1: Focus Score lớn (gradient circle), thông tin phiên (task, goal, allowed domains, thời gian, số mẫu, camera status), timeline, top domains, phân tích 4 tín hiệu. Trang 2: Phân tích AI chi tiết. Font tiếng Việt chuẩn, watermark chống giả mạo (“FocusProof Certified • SHA-256 Verified”), nút chia sẻ nhanh Facebook/TikTok.

- **AI Analysis (GPT-4o-mini)**: Input cho AI: session metadata, tóm tắt samples, typed content (500 ký tự cuối), voice note text (nếu có). Voice Note Summary: Sau session, người dùng bấm nút “Ghi âm tóm tắt” trong ResultScreen → Web Speech API ghi âm (thời gian tối đa 30 giây, không lưu file) → chuyển thành text tạm thời → gửi cho GPT. Xử lý lỗi: nếu deny micro → toast “Không thể ghi âm do quyền micro bị chặn” và bỏ qua.

- **Lịch sử & Báo cáo**: Heatmap 7 ngày, biểu đồ cột, lọc theo task/goal, export CSV/Excel.  

- **Session Hash & QR Code**: SHA-256 chứa đầy đủ metadata. QR hoạt động hoàn toàn local.

### 3. KIẾN TRÚC HỆ THỐNG (Manifest V3)

```
Chrome Browser
├── Popup (React 19)                  ← Giao diện chính
├── Content Script                    ← Activity tracking + Floating Widget
├── Offscreen Document                ← Camera + MediaPipe
├── Background Service Worker         ← Session, sampling, tracking, goal evaluation, alert
└── chrome.storage.local              ← Session, settings, allowedDomains, badges, lịch sử
```

**Luồng dữ liệu chính**: Popup → START_SESSION (task + goal + allowedDomains + allowExternalApps) → Background → realtime sampling + goal check → Stop → PDF + AI + QR.

### 4. TECH STACK

- Build: Vite 5 + @crxjs/vite-plugin  
- UI: React 19 + TypeScript 6  
- Face Detection: @mediapipe/tasks-vision 0.10.34  
- PDF: jsPDF 4.2.1 + html2canvas  
- QR: qrcode 1.5.4  
- AI: OpenAI GPT-4o-mini  
- Testing: Vitest + Chrome API mocks  
- Linter: ESLint + Prettier

### 5. CÁC THÀNH PHẦN QUAN TRỌNG CẦN XÂY DỰNG (Build từ đầu)

1. Utils Core (types, focus, storage, alert-system, goal-evaluator, gamification)  
2. Background Service Worker (session, tracking, goal evaluation)  
3. Content Script (activity + widget)  
4. Offscreen Document (camera + MediaPipe)  
5. Popup (StartScreen với allowed domains selector, modal camera)  
6. Certificate & AI (certificate.ts, ai-analysis.ts)  
7. Diagnostic & Test Suite

### 6. MÔ HÌNH HOẠT ĐỘNG (User Flow)

1. Mở extension → task presets + custom goal + chọn allowed domains + toggle “Allow external apps”.  
2. Chọn xong → modal hướng dẫn camera.  
3. Nhấn “Bắt đầu” → Background tạo Offscreen Document → Chrome hiện infobar xin phép camera **ngay lập tức**.  
4. Nếu deny camera → tự động chuyển sang Camera-Off Mode, session vẫn tiếp tục.  
5. Trong phiên: realtime tracking + alert theo goal.  
6. Nhấn Stop → PDF + AI + QR.  
7. Xem lịch sử, huy hiệu, chia sẻ nhanh.

**Tính bảo mật & riêng tư**: Không lưu ảnh/video, không quay màn hình, không đọc nội dung web. Tất cả dữ liệu cục bộ. API Key GPT dùng XOR-obfuscation. AI chỉ hoạt động khi opt-in.

---

