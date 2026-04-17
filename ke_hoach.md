**BẢN KẾ HOẠCH DỰ ÁN FOCUSPROOF**  
**Chứng chỉ Tập trung Thông minh & Xác thực**  
**Phiên bản Final – Xây dựng lại từ đầu**  

**Ngày lập kế hoạch:** 17/04/2026  
**Mục tiêu:** Xây dựng lại toàn bộ dự án theo bản mô tả hoàn chỉnh nhất, đảm bảo **hoạt động mượt mà, không lỗi runtime**, logic rõ ràng, dễ bảo trì và test đầy đủ.  

### 1. TỔNG QUAN KẾ HOẠCH

- **Thời gian tổng thể**: 6–8 tuần (có thể điều chỉnh linh hoạt).  
- **Tiêu chí thành công**:  
  - Dự án build sạch, chạy ổn định trên Chrome 116+.  
  - Tất cả logic cốt lõi (isGoalCompliant, Multi-Tab Guard, Goal-based alert, AI Analysis, Voice Note) hoạt động đúng.  
  - Test coverage ≥ 80% (unit + integration + manual).  
  - Không có race condition, memory leak, hoặc lỗi camera/offscreen.  
  - Có thể rebuild từ đầu chỉ bằng repo + `npm install`.  

- **Quy trình phát triển**: Git Flow (main / develop / feature/*), pre-commit hook (lint + type-check), Vitest cho test, manual checklist sau mỗi phase.

### 2. TECH STACK & CÔNG CỤ HỖ TRỢ

- **Core**: Vite 5 + @crxjs/vite-plugin, React 19 + TypeScript 6, @mediapipe/tasks-vision 0.10.34, jsPDF 4.2.1, qrcode 1.5.4, OpenAI GPT-4o-mini.  
- **Testing**: Vitest + jsdom + Chrome API mocks.  
- **Code Quality**: ESLint + Prettier + husky + lint-staged.  
- **Version Control**: Git + GitHub (branching strategy rõ ràng).  
- **Test Strategy**: Unit test (focus, goal-evaluator, isDomainAllowed), Integration test (session flow), Manual test checklist sau mỗi phase.

### 3. CÁC PHASE CHI TIẾT

#### **Phase 0: Project Setup & Foundation** (3–4 ngày)
**Mục tiêu**: Xây dựng nền tảng sạch, sẵn sàng rebuild từ đầu.  
**Công việc chính**:
- Tạo repo mới, cấu trúc thư mục theo mô tả.
- Cài đặt Vite + CRXJS + React 19 + TypeScript strict.
- Thiết lập ESLint, Prettier, husky, vitest.config.ts, tsconfig.json.
- Tạo các file core: `types.ts` (thêm GoalConfig, DEFAULT_GOAL_DOMAIN_RULES, DEFAULT_GOAL_EXTERNAL_APP_RULE, SessionMode), `storage.ts`, `api-key.ts`.
- Tạo manifest.json với đầy đủ permissions.

**Deliverables**: Repo sạch, build dev mode thành công, extension load được popup.  
**Test**: `npm run type-check`, `npm run lint`, load unpacked trong Chrome.  
**Rủi ro**: Không có.  

#### **Phase 1: Core Engine (Face, Activity, Tab & Screen Tracking, Goal-based Evaluation)** (8–10 ngày)
**Mục tiêu**: Xây dựng nền tảng phát hiện và logic cốt lõi ổn định.  
**Công việc chính**:
- Background Service Worker: session management, sampling 6 giây, tab/domain tracking, `isGoalCompliant()`, `isDomainAllowed()`.
- Offscreen Document: camera + MediaPipe (tối ưu timing, OFFSCREEN_READY message).
- Content Script: activity tracking (IME-aware), realtime check tab change.
- Triển khai Goal-based Evaluation (GOAL_DOMAIN_RULES, GOAL_EXTERNAL_APP_RULE, customAllowedDomains, customExternalRule).
- Multi-Tab Guard và realtime alert.

**Deliverables**: Session chạy realtime, widget hiển thị đúng 4 tín hiệu, alert theo goal hoạt động, camera ổn định.  
**Test**:
- Unit test cho `isGoalCompliant()`, `isDomainAllowed()`.
- Manual test: chuyển tab, rời Chrome, bật/tắt “Allow external apps”, thay đổi allowed domains.
- Test edge case: deny camera → tự động Camera-Off Mode.

#### **Phase 2: UX & Smart Task System** (6–7 ngày)
**Mục tiêu**: Xây dựng giao diện và logic người dùng.  
**Công việc chính**:
- Popup: StartScreen (task presets, custom goal, editable allowed domains list, toggle “Allow external apps”, modal hướng dẫn camera).
- Floating Widget (draggable, minimize, realtime update).
- Diagnostic Dashboard.
- Gamification (huy hiệu kiểm tra cuối session, lưu `badges` key).

**Deliverables**: Popup hoạt động mượt, widget responsive, modal camera rõ ràng.  
**Test**: Manual test full StartScreen flow, test realtime widget update, test allowed domains match.

#### **Phase 3: Certificate, AI Analysis & Voice Note** (7–9 ngày)
**Mục tiêu**: Hoàn thiện output và phân tích.  
**Công việc chính**:
- `certificate.ts`: PDF 2 trang, font tiếng Việt chuẩn, watermark, nút chia sẻ.
- `ai-analysis.ts`: Full AI features (input rõ ràng, Voice Note Summary với Web Speech API).
- Xử lý lỗi Voice Note (deny micro → toast + bỏ qua).
- Session Hash & QR Code.

**Deliverables**: PDF đẹp, AI trả về đúng khuyến nghị, Voice Note hoạt động.  
**Test**: Test PDF với nhiều task name có dấu, test AI prompt với mock, test Voice Note (allow/deny micro).

#### **Phase 4: Testing, Polish & Optimization** (5–6 ngày)
**Mục tiêu**: Đảm bảo dự án mượt mà, không lỗi.  
**Công việc chính**:
- Viết đầy đủ test suite (unit + integration).
- Refactor Background thành modules (session.ts, tracking.ts, goal-evaluator.ts).
- Performance optimization (widget, PDF generation).
- Error Boundary, graceful degradation.
- Accessibility & Theme System.

**Deliverables**: Test coverage ≥ 80%, checklist manual test pass 100%.  
**Test**: Full regression test, edge case test (deny camera, deny micro, nhiều tab switch, long session).

#### **Phase 5: Documentation & Final Review** (2–3 ngày)
**Mục tiêu**: Hoàn thiện tài liệu và sẵn sàng publish.  
**Công việc chính**:
- Cập nhật PROJECT_REPORT.md, README.md, GUIDE.md.
- Build production, hướng dẫn load unpacked.
- Final code review & cleanup.

**Deliverables**: Tài liệu đầy đủ, dự án build sạch.

### 4. QUY TRÌNH PHÁT TRIỂN & ĐẢM BẢO KHÔNG LỖI

- **Git Workflow**: Feature branch → PR → review → merge vào develop → release trên main.
- **Testing Strategy**: Unit test (Vitest) + Integration test + Manual checklist sau mỗi phase.
- **Pre-commit**: husky + lint-staged (không commit code lỗi).
- **Rủi ro & Mitigation**:  
  - Camera timing → dùng OFFSCREEN_READY message.  
  - Goal logic sai → test unit cho `isGoalCompliant()` và `isDomainAllowed()`.  
  - Memory leak → AbortController ở mọi Content Script và Offscreen.

---

