**KẾ HOẠCH TRIỂN KHAI FOCUSPROOF v1.1**  
**Monetization & Startup Edition**  
**Hồ sơ dự thi TECH STARTUP CHALLENGER 2026 — Khoa CNTT, ĐH Tôn Đức Thắng**  

**Ngày lập kế hoạch:** 18/04/2026  
**Nền tảng:** FocusProof v1.0 đã hoàn thiện (Core Engine, UX, PDF Certificate, AI Analysis, Gamification, Testing).  
**Mục tiêu v1.1:** Kinh doanh hóa sản phẩm, xây dựng backend, trang web bán hàng, Team Dashboard, hệ thống chống gian lận.  

---

## MỤC LỤC

1. [Tổng quan Kế hoạch](#1-tổng-quan-kế-hoạch)
2. [Tiêu chí Thành công](#2-tiêu-chí-thành-công)
3. [Kế hoạch theo Tuần](#3-kế-hoạch-theo-tuần)
4. [Danh sách File cần Sửa / Thêm](#4-danh-sách-file-cần-sửa--thêm)
5. [Quy trình Phát triển](#5-quy-trình-phát-triển)
6. [Testing Strategy v1.1](#6-testing-strategy-v11)
7. [Rủi ro & Mitigation theo Phase](#7-rủi-ro--mitigation-theo-phase)
8. [KPI & Metrics](#8-kpi--metrics)
9. [Tài chính Chi tiết: Doanh thu, Chi phí, Hòa vốn](#9-tài-chính-chi-tiết-doanh-thu-chi-phí-hòa-vốn)
10. [Kế hoạch Marketing & User Acquisition](#10-kế-hoạch-marketing--user-acquisition)
11. [Cơ cấu Đội ngũ & Đối tác](#11-cơ-cấu-đội-ngũ--đối-tác)
12. [Giải pháp Huy động Vốn](#12-giải-pháp-huy-động-vốn)
13. [Checklist Go-Live](#13-checklist-go-live)

---

### 1. TỔNG QUAN KẾ HOẠCH

- **Thời gian tổng thể**: 8–10 tuần (Q2–Q3/2026).
- **Số Phase**: 6 Phase (Week 1–2 → Week 9–10).
- **Team**: 1 fullstack developer (lead) + AI assistant + 1 marketing/UI designer (part-time).
- **Stack bổ sung**: Supabase (PostgreSQL + Auth + Edge Functions), Stripe/LemonSqueezy, Next.js 14, Tailwind CSS, Vercel.

**Sơ đồ tổng thể:**

```
Week 1–2    │ Phase 1: Supabase Backend + Auth + Credit System
Week 3–4    │ Phase 2: Extension Integration (Credit, License, Plan Check, Device Fingerprint)
Week 5–6    │ Phase 3: PDF Upgrade (Pie Chart, Bar Chart) + ResultScreen
Week 7      │ Phase 4: Trang Web bán hàng (Pricing Page + Landing)
Week 8      │ Phase 5: Team Dashboard + Referral System
Week 9–10   │ Phase 6: Testing, Polish, Marketing, Launch Prep
```

---

### 2. TIÊU CHÍ THÀNH CÔNG

| Tiêu chí | Mục tiêu | Đo lường |
|---|---|---|
| Backend ổn định | Supabase xử lý 1000+ requests/ngày, uptime ≥ 99.5% | Supabase Dashboard metrics |
| Credit system chính xác | Không sai lệch credit sau 100 test scenarios | Unit + integration test |
| License validation | Response time < 500ms (p95) | Edge Function logs |
| Anti-fraud | Phát hiện 100% trường hợp share license >3 thiết bị | Manual fraud test |
| PDF nâng cao | Pie + Bar chart render đúng, đẹp trên mọi data | Manual + screenshot diff |
| Trang web | Lighthouse score ≥ 90, mobile responsive | Lighthouse audit |
| Payment flow | E2E: mua → webhook → license → unlock | Stripe test mode |
| Conversion funnel | Free→Trial→Credit-exhausted→Upgrade tracked đầy đủ | Analytics tracking |
| Test coverage | ≥ 80% cho code mới v1.1 | Vitest coverage report |
| Launch readiness | Chrome Web Store approved trong 7 ngày | Submit ngày Day 3 Week 10 |

---

### 3. KẾ HOẠCH THEO TUẦN

---

#### **PHASE 1: Supabase Backend Setup (Week 1–2)**

**Mục tiêu:** Xây dựng nền tảng backend hoàn chỉnh, an toàn, scalable.

##### Week 1: Database + Auth + Core APIs

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Tạo Supabase project, setup database schema (users, teams, credit_transactions, license_keys, referrals, session_summaries) | Schema deployed, RLS policies active |
| Day 2 | Setup Supabase Auth (email/password + email verification), configure JWT | Auth flow signup/login/logout/verify |
| Day 3 | Edge Function: `/user/profile`, `/user/credits` | GET user info + credit balance |
| Day 4 | Edge Function: `/credits/deduct`, `/credits/add` (với idempotency key) | Atomic credit transactions + audit log |
| Day 5 | Edge Function: `/license/validate`, `/license/activate` (với device fingerprint check) | License activation với device limit |
| Day 6–7 | Unit test cho tất cả Edge Functions (Deno test) + load test cơ bản | ≥ 90% coverage Edge Functions |

##### Week 2: Payment + Advanced APIs + Anti-Fraud

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Setup Stripe/LemonSqueezy account + products (Pro monthly, Pro yearly, Team) | Payment products configured |
| Day 2 | Edge Function: `/payment/webhook` — Stripe webhook (signature verification + idempotency) | Webhook handler an toàn |
| Day 3 | Webhook logic: tạo license key, update user.plan, send email confirmation | E2E payment flow (test mode) |
| Day 4 | Edge Function: `/referral/generate`, `/referral/claim` (anti self-referral) | Referral logic hoàn chỉnh |
| Day 5 | Edge Function: `/team/members`, `/team/report`, `/team/invite` | Team API endpoints |
| Day 6 | Anti-fraud: device fingerprint validation + IP rate limit + abuse detection | Anti-fraud system v1 |
| Day 7 | Integration test toàn bộ API (signup → trial → credit → buy → license → use) | Full backend integration test pass |

**Rủi ro Phase 1:**

| Rủi ro | Giải pháp |
|---|---|
| Supabase Edge Function cold start chậm | Warm-up endpoint (cron 5 phút), cache responses |
| RLS policy sai → data leak | Test mỗi policy với 3 user khác nhau |
| Stripe webhook retry → duplicate license | Idempotency key + UNIQUE constraint trên `payment_intent_id` |

---

#### **PHASE 2: Extension Integration (Week 3–4)**

**Mục tiêu:** Tích hợp Credit, License, Plan, Device Fingerprint vào Chrome Extension.

##### Week 3: Auth + Credit UI trong Extension

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Tạo `src/utils/supabase-client.ts` — REST client lightweight cho extension | Supabase client gọn |
| Day 2 | Tạo `src/utils/auth.ts` — Login/Signup flow + JWT lưu trong `chrome.storage.local` | Auth modal hoạt động |
| Day 3 | Tạo `src/utils/credit-manager.ts` — Check credit, deduct via API, balance cache | Credit logic client |
| Day 4 | Tạo `src/utils/device-fingerprint.ts` — Canvas + WebGL + UA → SHA-256 hash | Device fingerprint utility |
| Day 5 | Sửa `src/popup/App.tsx` — Credit display header, plan badge | UI hiển thị credit + plan |
| Day 6 | Sửa `src/popup/components/ResultScreen.tsx` — AI button có credit cost | "Phân tích AI (20 Credit)" button |
| Day 7 | Test manual: signup → trial → hết trial → credit check → AI | Full user flow test |

##### Week 4: License + Plan Gate + Credit Exhausted Flow

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Tạo `src/popup/components/LicenseModal.tsx` — Nhập license key + activate | License activation UI |
| Day 2 | Tạo `src/popup/components/CreditExhaustedPopup.tsx` — Popup 3 nút | Credit exhausted popup |
| Day 3 | Tạo `src/popup/components/CreditConfirmDialog.tsx` — Xác nhận trước khi trừ | Confirmation dialog |
| Day 4 | Sửa `src/utils/ai-analysis.ts` — Credit check trước khi gọi OpenAI | AI gated by credit/plan |
| Day 5 | Sửa `src/popup/components/HistoryScreen.tsx` — "Trend 7 ngày (50 Credit)" | Trend với credit |
| Day 6 | Offline cache: lưu plan + credit, sync mỗi 24h, fallback graceful | Offline mode hoạt động |
| Day 7 | Test edge cases: offline→online, expired license, share license cross-device | Edge case test pass |

**Rủi ro Phase 2:**

| Rủi ro | Giải pháp |
|---|---|
| Extension popup chậm do API call | Cache aggressively (chrome.storage), lazy load auth |
| User đổi clock để kéo dài trial | Trial check **server-side** (Supabase `trial_end`) |
| Device fingerprint thay đổi sau update Chrome | Cho phép "soft re-activate" 1 lần/30 ngày |

---

#### **PHASE 3: PDF Upgrade + Pie Chart (Week 5–6)**

**Mục tiêu:** Nâng cấp PDF Certificate với biểu đồ, Pie Chart vào ResultScreen.

##### Week 5: Pie Chart + Bar Chart Components

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Tạo `src/utils/chart-renderer.ts` — Canvas API vẽ Pie + Horizontal Bar | Chart utilities |
| Day 2 | Tạo `src/popup/components/PieChart.tsx` (Canvas + animation) | Pie chart component |
| Day 3 | Tạo `src/popup/components/BarChart.tsx` (Canvas) | Bar chart component |
| Day 4 | Tích hợp vào `ResultScreen.tsx` — Compliance breakdown | Pie chart hiển thị trong ResultScreen |
| Day 5 | Styling: 3 màu (`#22C55E`, `#F59E0B`, `#EF4444`), animation, responsive | Đẹp + responsive |
| Day 6 | Plan gate: Free hết trial → blur + "Pro Feature" overlay | Feature gating |
| Day 7 | Unit test `chart-renderer.ts`, snapshot test PieChart/BarChart | Test pass |

##### Week 6: PDF Certificate v1.1

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Sửa `src/utils/certificate.ts` — Page 1 layout mới (chừa vùng cho charts) | PDF layout mới |
| Day 2 | Render Pie Chart → Canvas → `toDataURL()` → `addImage()` vào jsPDF | Pie chart trong PDF |
| Day 3 | Render Horizontal Bar Chart → Canvas → PDF | Bar chart trong PDF |
| Day 4 | Page 1 hoàn chỉnh: Score + Info + Pie + Bar + Timeline + Top Domains + Hash | Page 1 đầy đủ |
| Day 5 | Page 2: AI Analysis Only — layout sạch | Page 2 AI only |
| Day 6 | Test PDF: nhiều kịch bản (high/low score, camera off, long session, tiếng Việt) | PDF render đúng |
| Day 7 | Custom branding cho Team: logo + tên tổ chức trong PDF header | Team branding |

**Rủi ro Phase 3:**

| Rủi ro | Giải pháp |
|---|---|
| Canvas render khác nhau giữa OS | Test trên Windows + Mac + Linux |
| PDF file size lớn do chart images | Canvas resolution 2x, compress PNG |
| Font tiếng Việt lỗi trong chart | Canvas font loading API |

---

#### **PHASE 4: Trang Web bán hàng (Week 7)**

**Mục tiêu:** Trang web chuyên nghiệp (Pricing + Landing).

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Setup Next.js 14 (App Router) + Tailwind CSS + deploy Vercel | Project + live URL |
| Day 2 | Landing Page: Hero + How it works (3 bước) + Features grid + screenshot | Landing responsive |
| Day 3 | Pricing Page: 3 cột (Free/Pro/Team), cột Pro highlight + badge "Recommended" | Pricing kiểu GitHub Copilot |
| Day 4 | Stripe Checkout: nút "Bắt đầu ngay" → Checkout Session → success/cancel page | Payment E2E |
| Day 5 | FAQ + Testimonials placeholder + Footer (Privacy, Terms, Contact) | Page hoàn thiện |
| Day 6 | SEO: meta tags, Open Graph, sitemap, robots.txt, Google Analytics 4 | SEO + tracking |
| Day 7 | Responsive test (mobile/tablet/desktop) + Lighthouse ≥ 90 | Responsive + perf |

**Rủi ro Phase 4:**

| Rủi ro | Giải pháp |
|---|---|
| Stripe Checkout redirect lỗi | Test multiple browsers + Stripe test mode |
| SEO ranking thấp ban đầu | Content marketing + backlinks + Chrome Web Store |

---

#### **PHASE 5: Team Dashboard + Referral System (Week 8)**

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Team Dashboard: Auth + Overview tab | Dashboard với overview |
| Day 2 | Members tab: danh sách + invite flow (email) | Member management |
| Day 3 | Reports tab: Bar chart so sánh + Line chart xu hướng | Team analytics |
| Day 4 | Settings: quản lý thành viên, custom branding upload, billing | Team settings |
| Day 5 | Referral System: tạo code, claim logic, anti-self-referral | Referral hoạt động |
| Day 6 | Extension: thêm "Mời bạn bè" section, share buttons (FB/Twitter/Link) | Referral UI extension |
| Day 7 | Extension: gửi `session_summaries` lên Supabase (opt-in cho Team) | Team data sync |

**Rủi ro Phase 5:**

| Rủi ro | Giải pháp |
|---|---|
| Team data privacy concern | Chỉ sync summary. Opt-in rõ ràng. Privacy policy chi tiết |
| Referral abuse (bot) | Email verify + device fingerprint + min session ≥5 phút |

---

#### **PHASE 6: Testing, Polish, Marketing, Launch Prep (Week 9–10)**

##### Week 9: Testing & Bug Fix

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | Unit test cho tất cả utils mới | ≥ 80% coverage |
| Day 2 | Integration test full user journey (signup→trial→credit→buy→Pro→AI) | Integration pass |
| Day 3 | Integration test team flow (create→invite→use→admin view) | Team integration pass |
| Day 4 | E2E test: Extension + Backend + Payment (Stripe test mode) | E2E pass |
| Day 5 | Security audit: RLS, JWT, webhook signature, XSS, fingerprint | Security checklist |
| Day 6 | Performance test: popup < 1s, PDF < 3s | Perf benchmarks |
| Day 7 | Bug fix sprint | Zero critical bugs |

##### Week 10: Polish & Launch

| Ngày | Công việc | Deliverable |
|---|---|---|
| Day 1 | UI polish: micro-interactions, loading states, error messages | Polished UI |
| Day 2 | Documentation: README, Privacy Policy, Terms of Service | Legal docs |
| Day 3 | Chrome Web Store listing: screenshots, mô tả, promotional images, **submit** | Store submitted |
| Day 4 | Beta testing: 5–10 user thực tế (sinh viên CNTT TDTU + freelancer) | Beta feedback |
| Day 5 | Fix feedback issues, final adjustments | Final fixes |
| Day 6 | Production deploy: Supabase prod, Vercel prod, Stripe live mode | Production ready |
| Day 7 | **🚀 LAUNCH**: Chrome Web Store live + announce social media | v1.1 LIVE |

---

### 4. DANH SÁCH FILE CẦN SỬA / THÊM

#### 4.1 File mới cần tạo

| File | Mục đích | Phase |
|---|---|---|
| `src/utils/supabase-client.ts` | REST client cho extension | Phase 2 |
| `src/utils/auth.ts` | Login/Signup/JWT management | Phase 2 |
| `src/utils/credit-manager.ts` | Credit check, deduct, balance, trial | Phase 2 |
| `src/utils/device-fingerprint.ts` | Canvas+WebGL+UA fingerprint | Phase 2 |
| `src/utils/chart-renderer.ts` | Canvas vẽ Pie + Bar | Phase 3 |
| `src/popup/components/PieChart.tsx` | React Pie Chart component | Phase 3 |
| `src/popup/components/BarChart.tsx` | React Horizontal Bar Chart | Phase 3 |
| `src/popup/components/LicenseModal.tsx` | UI nhập license key | Phase 2 |
| `src/popup/components/CreditExhaustedPopup.tsx` | Popup khi hết credit | Phase 2 |
| `src/popup/components/CreditConfirmDialog.tsx` | Dialog xác nhận trừ credit | Phase 2 |
| `src/popup/components/AuthModal.tsx` | Login/Signup modal | Phase 2 |
| `src/popup/components/ReferralSection.tsx` | UI referral code + share | Phase 5 |
| `src/popup/components/PlanBadge.tsx` | Badge plan (Free/Pro/Team) | Phase 2 |
| `src/popup/styles/LicenseModal.css` | Styles | Phase 2 |
| `src/popup/styles/CreditPopup.css` | Styles | Phase 2 |
| `src/popup/styles/AuthModal.css` | Styles | Phase 2 |
| `src/popup/styles/Charts.css` | Styles | Phase 3 |
| `src/__tests__/credit-manager.test.ts` | Test credit logic | Phase 2 |
| `src/__tests__/auth.test.ts` | Test auth | Phase 2 |
| `src/__tests__/device-fingerprint.test.ts` | Test fingerprint | Phase 2 |
| `src/__tests__/chart-renderer.test.ts` | Test chart rendering | Phase 3 |
| `supabase/migrations/001_initial.sql` | Database migration | Phase 1 |
| `supabase/functions/credits-deduct/index.ts` | Edge Function | Phase 1 |
| `supabase/functions/credits-add/index.ts` | Edge Function | Phase 1 |
| `supabase/functions/license-validate/index.ts` | Edge Function | Phase 1 |
| `supabase/functions/license-activate/index.ts` | Edge Function | Phase 1 |
| `supabase/functions/payment-webhook/index.ts` | Stripe webhook | Phase 1 |
| `supabase/functions/referral-claim/index.ts` | Edge Function | Phase 1 |
| `supabase/functions/team-report/index.ts` | Team aggregate | Phase 1 |
| `web/` | Next.js project (Pricing + Dashboard) | Phase 4–5 |

#### 4.2 File hiện có cần sửa

| File | Thay đổi | Phase |
|---|---|---|
| `src/popup/App.tsx` | Credit display, plan badge, auth state, route license/auth modals | Phase 2 |
| `src/popup/App.css` | Styles credit header + plan badge | Phase 2 |
| `src/popup/components/ResultScreen.tsx` | Pie Chart, AI button có credit cost, plan gate | Phase 2–3 |
| `src/popup/styles/ResultScreen.css` | Styles Pie Chart + credit info | Phase 3 |
| `src/popup/components/HistoryScreen.tsx` | "Trend 7 ngày (50 Credit)" button, plan gate | Phase 2 |
| `src/popup/styles/HistoryScreen.css` | Styles trend button | Phase 2 |
| `src/popup/components/StartScreen.tsx` | Plan info display, trial countdown | Phase 2 |
| `src/utils/ai-analysis.ts` | Credit check + plan verification trước khi gọi OpenAI | Phase 2 |
| `src/utils/certificate.ts` | PDF layout mới: Pie + Bar + redesign Page 1+2 | Phase 3 |
| `src/utils/types.ts` | Types: UserPlan, CreditTransaction, LicenseKey, TeamMember, ComplianceSample | Phase 2 |
| `src/utils/storage.ts` | Keys cho plan, credit cache, auth token | Phase 2 |
| `src/background/session-manager.ts` | Gửi session_summary lên Supabase (opt-in) | Phase 5 |
| `manifest.json` | host_permissions cho Supabase domain | Phase 2 |
| `package.json` | Dependencies mới nếu cần | Phase 2 |

#### 4.3 Tổng kết

| Loại | Số lượng |
|---|---|
| File mới (Extension) | ~21 files |
| File mới (Supabase) | ~8 files |
| File mới (Web) | ~15–20 files (Next.js project) |
| File sửa (Extension) | ~14 files |
| **Tổng thay đổi** | **~58–63 files** |

---

### 5. QUY TRÌNH PHÁT TRIỂN

#### 5.1 Git Branching

```
main (production)
  └── develop (integration)
        ├── feature/supabase-backend     (Phase 1)
        ├── feature/extension-credit     (Phase 2)
        ├── feature/pdf-charts           (Phase 3)
        ├── feature/pricing-website      (Phase 4)
        ├── feature/team-dashboard       (Phase 5)
        └── feature/launch-prep          (Phase 6)
```

#### 5.2 Workflow

1. Checkout `feature/*` từ `develop`.
2. Phát triển + commit thường xuyên + viết test song song.
3. Self-review + lint + type-check.
4. Merge vào `develop` → manual test.
5. Phase hoàn thành → merge `develop` → `main` → tag release.

#### 5.3 Pre-commit

```bash
# husky + lint-staged
npx lint-staged
# Runs: eslint --fix, prettier --write, tsc --noEmit
```

---

### 6. TESTING STRATEGY v1.1

#### 6.1 Test Matrix

| Layer | Tool | Coverage | Phase |
|---|---|---|---|
| Supabase Edge Functions | Deno test | ≥ 90% | Phase 1 |
| Extension Utils | Vitest | ≥ 80% | Phase 2–3 |
| React Components mới | Vitest + RTL | ≥ 70% | Phase 2–3 |
| Integration (Ext ↔ Backend) | Vitest + mock Supabase | ≥ 70% | Phase 2 |
| E2E (Full flow) | Manual checklist | 100% pass | Phase 6 |
| Web App | Vitest + Playwright | ≥ 70% | Phase 4–5 |

#### 6.2 Manual Test Checklist v1.1

```
□ Signup mới → nhận 100 Credit + email verification
□ Login → Credit hiển thị đúng
□ Trial 7 ngày → AI Analysis không trừ credit
□ Hết trial → AI Analysis trừ 20 Credit
□ Trend 7 ngày trừ 50 Credit
□ Credit = 0 → CreditExhaustedPopup hiển thị
□ Nút "Mua ngay" → mở Pricing page
□ Nút "Mời bạn" → hiển thị referral code + copy
□ Nhập License Key hợp lệ → unlock Pro
□ Nhập License Key sai → toast lỗi
□ Pro plan → AI Analysis không trừ credit
□ Pro plan → PDF có Pie + Bar Chart
□ Free hết trial → Pie Chart bị blur + "Pro Feature"
□ Pie Chart màu đúng (xanh/vàng/đỏ)
□ Bar Chart 4 signals đúng
□ PDF Page 1 đầy đủ: Score + Info + Pie + Bar + Timeline + Hash
□ PDF Page 2 chỉ AI Analysis
□ Referral: mời → bạn cài + 1 session ≥5 phút → cả 2 nhận credit
□ Self-referral bị chặn (cùng device fingerprint)
□ License chia sẻ trên thiết bị thứ 4 → bị chặn
□ Team admin mời member → member accept → data sync
□ Team Dashboard: overview + members + reports đúng
□ Offline: extension hoạt động với cached plan/credit
□ Stripe: mua Pro → webhook → license → unlock (test mode)
□ Stripe webhook duplicate → không tạo 2 license
```

---

### 7. RỦI RO & MITIGATION THEO PHASE

| Phase | Rủi ro chính | XS | Giải pháp |
|---|---|---|---|
| **Phase 1** | Schema design sai → migrate lại | TB | Review schema kỹ. Dùng migration files |
| **Phase 1** | Stripe webhook phức tạp | TB | Stripe CLI test local + follow docs |
| **Phase 1** | RLS policy data leak | TB | Test với 3 user khác nhau |
| **Phase 2** | Extension popup chậm | Cao | Cache trong chrome.storage. Lazy load |
| **Phase 2** | User manipulate trial | TB | Trial check server-side |
| **Phase 2** | License share bypass | Cao | Device fingerprint + max 3 devices |
| **Phase 3** | Canvas render inconsistent | Thấp | Test 3 OS. Pixel ratio detection |
| **Phase 3** | PDF size lớn | TB | Canvas 2x resolution. Compress PNG |
| **Phase 4** | Stripe redirect lỗi | Thấp | Test multi-browser |
| **Phase 4** | SEO thấp ban đầu | Cao | Content marketing + Chrome Store |
| **Phase 5** | Team data privacy pushback | TB | Chỉ summary. Opt-in. Privacy policy |
| **Phase 5** | Referral abuse | TB | Email verify + fingerprint + min session |
| **Phase 6** | Chrome Store review delay | Cao | Submit sớm Day 3 Week 10 |
| **Phase 6** | Production env khác staging | TB | Staging→Prod checklist. Env vars |

---

### 8. KPI & METRICS

#### 8.1 Launch Metrics (Tháng đầu sau launch)

| Metric | Mục tiêu | Đo bằng |
|---|---|---|
| Installs | 200+ | Chrome Web Store Analytics |
| Active Users (WAU) | 100+ | Supabase user count |
| Trial → Free conversion | 80%+ | Supabase query |
| Free → Pro conversion | 2.5% | Stripe dashboard |
| Sessions/user/week | 3+ | session_summaries table |
| Revenue (MRR) | $25+ | Stripe dashboard |
| Referral rate | 5%+ users share | referrals table |
| Support tickets | < 5/tuần | Email inbox |

#### 8.2 Long-term Metrics (Năm 1, Năm 2)

| Metric | Cuối Năm 1 | Cuối Năm 2 |
|---|---|---|
| MAU | 5,000 | 30,000 |
| MRR | $1,287 | $10,000 |
| Pro subscribers | 230 | 1,500 |
| Team accounts | 5 | 30 |
| Churn rate | < 8%/tháng | < 5%/tháng |
| NPS Score | > 30 | > 45 |

---

### 9. TÀI CHÍNH CHI TIẾT: DOANH THU, CHI PHÍ, HÒA VỐN

#### 9.1 Mô hình doanh thu Năm 1 (Base Case)

| Tháng | Users | Pro | Team | MRR ($) | Cumulative Rev ($) |
|---|---|---|---|---|---|
| M1 | 200 | 5 | 0 | 25 | 25 |
| M2 | 400 | 12 | 0 | 60 | 85 |
| M3 | 700 | 22 | 0 | 110 | 195 |
| M4 | 1,100 | 35 | 5 | 194 | 389 |
| M5 | 1,500 | 48 | 10 | 279 | 668 |
| M6 | 2,000 | 65 | 10 | 364 | 1,032 |
| M7 | 2,500 | 90 | 10 | 489 | 1,521 |
| M8 | 3,000 | 110 | 15 | 608 | 2,129 |
| M9 | 3,500 | 135 | 18 | 745 | 2,874 |
| M10 | 4,000 | 165 | 24 | 919 | 3,793 |
| M11 | 4,500 | 195 | 28 | 1,085 | 4,878 |
| M12 | 5,000 | 230 | 35 | 1,287 | **6,165** |

#### 9.2 Kịch bản

| Kịch bản | MRR cuối năm 1 | ARR | Ghi chú |
|---|---|---|---|
| **Worst** | $400 | $4,800 | Conversion 1.5%, no Team |
| **Base** | $1,287 | $15,440 | Conversion 4.6%, 5 Team accounts |
| **Best** | $3,200 | $38,400 | Conversion 8% + 10 Team + viral referral |

#### 9.3 Cơ cấu chi phí

**CAPEX (one-time):**

| Khoản | USD |
|---|---|
| Domain focusproof.com (1 năm) | 12 |
| Logo & branding design | 50 |
| Chrome Web Store fee | 5 |
| **Total CAPEX** | **67** |

**OPEX hàng tháng:**

| Khoản | M1–M3 | M4–M9 | M10–M12 |
|---|---|---|---|
| Supabase | 0 | 0 | 25 |
| Vercel | 0 | 0 | 20 |
| OpenAI API | 5 | 20 | 60 |
| Stripe phí (2.9%+$0.30) | 1 | 15 | 45 |
| Email service | 0 | 0 | 10 |
| Marketing (ads/content) | 0 | 50 | 150 |
| **Total/tháng** | **6** | **85** | **310** |

**Tổng chi phí năm 1:** ~$67 (CAPEX) + 3×$6 + 6×$85 + 3×$310 = ~$1,525

#### 9.4 Hòa vốn (Break-even)

```
Cumulative Revenue M4 = $389
Cumulative Cost M4    = $67 + 3×6 + 1×85 = $170
→ Hòa vốn tại M4 (tháng 4 sau launch)

Lợi nhuận ròng năm 1: $6,165 - $1,525 ≈ $4,640
Tỷ suất lợi nhuận: ~75%
```

#### 9.5 Unit Economics

| Metric | Giá trị |
|---|---|
| ARPU Pro | $4.99/tháng |
| ARPU Team (per seat) | $3.99/tháng |
| CAC (chủ yếu organic) | ~$1.50 |
| LTV Pro (12 tháng avg) | $59.88 |
| LTV/CAC ratio | ~40× ✨ |
| Gross margin | ~85% |
| Payback period | 0.3 tháng (rất nhanh) |

---

### 10. KẾ HOẠCH MARKETING & USER ACQUISITION

#### 10.1 Kênh tiếp cận khách hàng

| Kênh | Chi phí | Hiệu quả dự kiến | Giai đoạn |
|---|---|---|---|
| **Chrome Web Store SEO** | Free | 30% installs | Liên tục |
| **Product Hunt launch** | Free | 200–500 installs trong 24h | Launch day |
| **Reddit** (r/productivity, r/getmotivated, r/freelance) | Free | 100–300 installs/post | Tuần đầu launch |
| **TikTok/YouTube Shorts** (demo extension) | Low | Viral potential | Tháng 1–6 |
| **Facebook Group sinh viên** (TDTU + ĐH khác) | Free | 50–100 installs/group | Tháng 1–3 |
| **Influencer micro** (productivity YouTubers VN) | $50–200/post | 200–1,000 installs | Tháng 2–6 |
| **Content blog SEO** (Medium, Dev.to) | Free (time) | Long-tail traffic | Liên tục |
| **Google Ads** (keyword "focus tracker") | $100/tháng | 50 installs/tháng | Tháng 4+ |
| **Partnership trường đại học** | Free (outreach) | Team accounts | Tháng 6+ |

#### 10.2 Content Marketing Plan

| Tuần | Nội dung |
|---|---|
| Tuần 1 sau launch | Blog "Tôi xây dựng Chrome Extension đo tập trung như thế nào" (kỹ thuật) |
| Tuần 2 | Video demo TikTok 60s: "Cách chứng minh bạn học đủ 8 tiếng/ngày" |
| Tuần 3 | Reddit post r/productivity: "Made a free extension to prove your focus" |
| Tuần 4 | Product Hunt launch (chuẩn bị từ tuần 2) |
| Tháng 2 | Case study: "Sinh viên TDTU dùng FocusProof tăng GPA thế nào" |
| Tháng 3 | Comparison post: "FocusProof vs RescueTime vs Forest" |
| Tháng 4+ | SEO blog (1 bài/tuần): productivity tips, focus science, remote work |

#### 10.3 Kênh truyền thông độc đáo

- **PDF Certificate viral**: Mỗi PDF có watermark + footer link → user share → exposure miễn phí.
- **QR Code verification**: User share QR trên LinkedIn/Twitter → click → landing page → install.
- **Referral viral loop**: Free user tự giới thiệu để có credit → tăng trưởng cấp số nhân.
- **Open source partial**: Open source phần Core Engine (focus.ts, goal-evaluator.ts) trên GitHub → developer community trust + backlinks SEO.

#### 10.4 Funnel Conversion

```
[1,000 visitor pricing page]
        │ 30% → install
        ▼
[300 installs]
        │ 80% → tạo account
        ▼
[240 active users]
        │ 60% → hoàn thành ≥3 sessions trong 7 ngày trial
        ▼
[144 engaged users]
        │ 70% → tiếp tục dùng sau trial
        ▼
[100 retained users]
        │ 5% → upgrade Pro
        ▼
[5 Pro subscribers] → MRR $25
```

#### 10.5 KPI Marketing tháng đầu

| KPI | Mục tiêu |
|---|---|
| Pricing page visits | 1,000+ |
| Install rate (visit → install) | 25%+ |
| Activation rate (install → first session) | 70%+ |
| 7-day retention | 40%+ |
| 30-day retention | 25%+ |
| Free → Pro conversion | 2.5%+ |

---

### 11. CƠ CẤU ĐỘI NGŨ & ĐỐI TÁC

#### 11.1 Đội ngũ thực hiện (Đề xuất)

| Vai trò | Số lượng | Trách nhiệm |
|---|---|---|
| **Founder / Lead Developer** | 1 | Fullstack: extension + backend + web. Quản lý sản phẩm |
| **UI/UX Designer** (part-time) | 1 | Wireframe, branding, marketing visual |
| **Marketing & Content** (part-time) | 1 | Social media, blog, video, community |
| **QA / Beta Tester** (volunteer) | 2–3 | Sinh viên CNTT TDTU test alpha/beta |

**Tổng:** 1 fulltime + 2 part-time + 2–3 volunteer.

#### 11.2 Đối tác chính

| Đối tác | Vai trò |
|---|---|
| **Khoa CNTT — ĐH Tôn Đức Thắng** | Bảo trợ học thuật, beta testing với sinh viên, Team account pilot |
| **Supabase** | Backend infra (free tier hỗ trợ startup) |
| **Vercel** | Hosting (free tier) |
| **Stripe / LemonSqueezy** | Payment gateway |
| **OpenAI** | AI API (GPT-4o-mini) |
| **MediaPipe (Google)** | Face detection (open source) |
| **Cộng đồng productivity VN** | Truyền thông, feedback |

#### 11.3 Tính sẵn sàng tham gia

- Founder: full-time commitment, đã hoàn thành v1.0 độc lập trong 6–8 tuần.
- Beta tester: 5+ sinh viên CNTT TDTU đã đăng ký tham gia (qua khảo sát).
- UI/UX và Marketing: tuyển từ cộng đồng sinh viên, trao đổi bằng credit/share equity nhỏ.

---

### 12. GIẢI PHÁP HUY ĐỘNG VỐN

#### 12.1 Vốn cần thiết 6 tháng đầu

| Khoản | USD | VND tương đương (tỷ giá 25,000) |
|---|---|---|
| CAPEX (domain, design, fee) | 67 | 1,675,000 |
| OPEX 6 tháng (avg $40/th) | 240 | 6,000,000 |
| Marketing 6 tháng | 200 | 5,000,000 |
| Dự phòng (15%) | 75 | 1,875,000 |
| **Tổng** | **~$582** | **~14,500,000 VND** |

#### 12.2 Nguồn huy động

| Nguồn | Số tiền | Ghi chú |
|---|---|---|
| **Vốn tự có** (founder) | 100% | ~15 triệu VND — khả năng tự chi trả |
| **Giải thưởng cuộc thi** (TECH STARTUP CHALLENGER 2026) | 2–5 triệu | Nếu đạt giải Ba/Nhì/Nhất |
| **Tài trợ từ nhà bảo trợ chuyên môn** | Variable | Hỗ trợ doanh nghiệp đối tác |
| **Doanh thu sớm** (M1–M6) | $1,000+ | Self-funded từ MRR sớm |
| **Angel investor / quỹ khởi nghiệp** | Khi cần | Sau khi đạt PMF (~Tháng 6+) |

#### 12.3 Chiến lược bootstrap

> Dự án có **gross margin ~85%** và **break-even tháng 4**, nên hoàn toàn có thể bootstrap không cần vốn ngoài. Vốn ngoài chỉ cần khi muốn **scale nhanh hơn** (paid ads, hire team).

---

### 13. CHECKLIST GO-LIVE

#### 13.1 Pre-launch (Week 9)

```
□ Tất cả tests pass (unit + integration + E2E)
□ Security audit pass (RLS, JWT, webhook, XSS, fingerprint)
□ Performance benchmarks pass (popup < 1s, PDF < 3s)
□ Supabase production project created
□ Stripe live mode configured
□ Environment variables set (production)
□ Privacy Policy published
□ Terms of Service published
□ Chrome Web Store listing prepared (screenshots, description)
□ Domain configured (DNS + SSL)
□ Vercel production deployed
□ Email templates configured (welcome, license, receipt)
□ Anti-fraud system tested (license share, self-referral)
```

#### 13.2 Launch Day (Week 10, Day 7)

```
□ Merge develop → main
□ Tag release v1.1.0
□ Build production extension
□ Submit Chrome Web Store (đã submit từ Day 3)
□ Verify Stripe live webhooks
□ Verify Supabase production
□ Verify web app production
□ Product Hunt launch
□ Reddit post (3 subreddits)
□ Facebook Group sinh viên
□ Email beta testers thông báo launch
□ Monitor error logs (Supabase, Vercel, Stripe)
```

#### 13.3 Post-launch (Week 11+)

```
□ Daily KPI monitoring (installs, signups, conversions)
□ Respond user feedback within 24h
□ Fix critical bugs same day
□ Weekly report: KPIs + issues + next actions
□ Monthly content blog/video
□ Plan v1.2 dựa trên user feedback (mobile companion? Edge support?)
```

---

**Kế hoạch này là roadmap chi tiết cho FocusProof v1.1 — sẵn sàng nộp dự thi TECH STARTUP CHALLENGER 2026.**  
**Tham khảo ý tưởng chi tiết tại: `y_tuong_v1.1.md`**
