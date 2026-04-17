**FOCUSPROOF v1.1 — MONETIZATION & STARTUP EDITION**  
**Ý tưởng Chi tiết — Hồ sơ dự thi TECH STARTUP CHALLENGER 2026**  
**(Phiên bản chính thức — Dựa trên nền tảng v1.0 đã hoàn thiện)**

---

## MỤC LỤC

0. [Tóm tắt Điều hành (Executive Summary)](#0-tóm-tắt-điều-hành-executive-summary)
1. [Tổng quan Giai đoạn v1.1](#1-tổng-quan-giai-đoạn-v11)
2. [Vấn đề Thị trường & Cơ hội](#2-vấn-đề-thị-trường--cơ-hội)
3. [Mô hình Kinh doanh Freemium](#3-mô-hình-kinh-doanh-freemium)
4. [Hệ thống Credit](#4-hệ-thống-credit)
5. [Hệ thống License Key & Backend (Supabase)](#5-hệ-thống-license-key--backend-supabase)
6. [User Flow khi hết Credit](#6-user-flow-khi-hết-credit)
7. [Trang Web bán hàng (Pricing Page) + Wireframes](#7-trang-web-bán-hàng-pricing-page--wireframes)
8. [Cải tiến PDF Certificate v1.1](#8-cải-tiến-pdf-certificate-v11)
9. [Pie Chart trong ResultScreen](#9-pie-chart-trong-resultscreen)
10. [Team Dashboard & Quản lý Nhóm](#10-team-dashboard--quản-lý-nhóm)
11. [Referral System](#11-referral-system)
12. [Phân tích Đối thủ Cạnh tranh & Lợi thế Khác biệt](#12-phân-tích-đối-thủ-cạnh-tranh--lợi-thế-khác-biệt)
13. [Số liệu Tài chính Chi tiết](#13-số-liệu-tài-chính-chi-tiết)
14. [Kiến trúc Hệ thống v1.1](#14-kiến-trúc-hệ-thống-v11)
15. [Rủi ro & Giải pháp (bao gồm Anti-Fraud)](#15-rủi-ro--giải-pháp-bao-gồm-anti-fraud)
16. [Tác động Xã hội & Tầm nhìn](#16-tác-động-xã-hội--tầm-nhìn)

---

### 0. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

| Mục | Nội dung |
|---|---|
| **Tên dự án** | FocusProof — Chứng chỉ Tập trung Thông minh & Xác thực |
| **Phiên bản** | v1.1 — Monetization & Startup Edition |
| **Loại sản phẩm** | Chrome Extension (MV3) + SaaS Backend + Web Pricing/Dashboard |
| **Đối tượng khách hàng** | Sinh viên, học sinh online, freelancer, lập trình viên, nhân viên remote, tổ chức giáo dục, doanh nghiệp |
| **Vấn đề giải quyết** | Khó khăn đo lường — chứng minh — cải thiện sự tập trung trong làm việc/học tập từ xa |
| **Giải pháp** | Đo lường tập trung 3 tín hiệu (Camera + Activity + Tab) + AI phân tích + Chứng chỉ PDF có QR xác thực |
| **Mô hình doanh thu** | Freemium: Free (7 ngày trial + 100 Credit) → Pro $4.99/tháng → Team $3.99/người/tháng |
| **Lợi thế cạnh tranh** | 100% xử lý cục bộ (privacy-first), chứng chỉ PDF có hash + QR xác thực (duy nhất trên thị trường), chi phí thấp |
| **Doanh thu năm 1 (Base)** | ~$3,200 MRR cuối năm 1 (~$18,000 doanh thu năm 1) |
| **Hòa vốn** | Tháng thứ 4–5 sau launch (≥10 Pro subscribers) |
| **Thời gian triển khai** | 8–10 tuần (Q2–Q3/2026) |
| **Vốn cần thiết** | ~$500 cho 6 tháng đầu (domain, paid services khi scale) |

**Tagline:** *"Chứng minh sự tập trung của bạn — bằng dữ liệu thực, không phải lời nói."*

---

### 1. TỔNG QUAN GIAI ĐOẠN v1.1

**FocusProof v1.0** đã hoàn thiện toàn bộ tính năng cốt lõi: Face Detection (MediaPipe BlazeFace), Activity Tracking (IME-aware), Tab & Screen Tracking realtime, Goal-based Evaluation, PDF Certificate 2 trang, AI Analysis (GPT-4o-mini), Gamification (streak + badges), Voice Note Summary, QR Code xác thực bằng SHA-256.

**v1.1** chuyển sang giai đoạn **Monetization & Startup Edition** với mục tiêu:

- **Kinh doanh hóa** sản phẩm thông qua mô hình Freemium + Credit System.
- **Xây dựng backend** (Supabase) để quản lý License Key, Credit, User, Team.
- **Trang web bán hàng** chuyên nghiệp (Pricing Page 3 cột kiểu GitHub Copilot).
- **Nâng cấp PDF** với biểu đồ trực quan (Pie Chart, Horizontal Bar Chart).
- **Team Dashboard** dành cho doanh nghiệp và tổ chức giáo dục.
- **Referral System** để tăng trưởng người dùng tự nhiên (viral loop).
- **Hệ thống chống gian lận** (device fingerprint, server-side credit check, license activation limit).

**Triết lý cốt lõi không đổi:**
- 100% dữ liệu phiên xử lý cục bộ (local-first).
- AI Analysis là tính năng premium, gọi API chỉ khi user chọn.
- Privacy-first: không thu thập dữ liệu cá nhân, không tracking, không bán data.

---

### 2. VẤN ĐỀ THỊ TRƯỜNG & CƠ HỘI

#### 2.1 Vấn đề thực tế

Sau đại dịch COVID-19, **làm việc và học tập từ xa** trở thành xu hướng không thể đảo ngược. Tuy nhiên người dùng và tổ chức gặp phải:

| Vấn đề | Đối tượng bị ảnh hưởng |
|---|---|
| Không có cách đo **khách quan** mức độ tập trung | Sinh viên, freelancer |
| Không thể **chứng minh** với người khác (giảng viên, sếp, khách hàng) là mình đã tập trung làm việc | Học sinh online, freelancer làm theo giờ |
| Phần mềm theo dõi nhân viên (Hubstaff, Time Doctor) **xâm phạm quyền riêng tư** (chụp màn hình, log keystroke) | Nhân viên remote |
| Khó **cải thiện** thói quen vì không có dữ liệu lịch sử cụ thể | Tất cả đối tượng |
| Tổ chức giáo dục/doanh nghiệp **không có công cụ đo lường nhẹ** mà tôn trọng quyền riêng tư | Trường học, công ty SME |

#### 2.2 Quy mô thị trường (TAM/SAM/SOM)

| Cấp độ | Quy mô | Diễn giải |
|---|---|---|
| **TAM** (Total Addressable Market) | ~1.2 tỷ người dùng Chrome trên thế giới | Toàn bộ người dùng có thể cài extension |
| **SAM** (Serviceable Available Market) | ~80 triệu remote workers + ~220 triệu sinh viên đại học toàn cầu | Đối tượng học/làm cần đo lường tập trung |
| **SOM** (Serviceable Obtainable Market — 3 năm) | ~50,000 active users (~0.02% SAM) | Mục tiêu thực tế trong 3 năm đầu |
| **SOM Việt Nam (năm 1)** | ~3,000–5,000 users | Sinh viên + freelancer Việt |

#### 2.3 Tại sao bây giờ?

- Chrome Extension MV3 đã ổn định (2024+), Offscreen Document API hỗ trợ camera đầy đủ.
- MediaPipe WASM cho face detection chạy mượt local, bảo mật.
- GPT-4o-mini giảm chi phí AI xuống 100x so với GPT-4 (2024–2025).
- Supabase trưởng thành — backend startup-friendly, free tier hào phóng.
- Nhu cầu remote work + "productivity proof" tăng cao sau COVID.

---

### 3. MÔ HÌNH KINH DOANH FREEMIUM

#### 3.1 Bảng so sánh Gói dịch vụ

| Tính năng | **Free** | **Pro Cá nhân** | **Team / Education** |
|---|---|---|---|
| **Giá** | $0 | $4.99/tháng hoặc $49/năm | $3.99/người/tháng (tối thiểu 5 người) |
| **Thời gian dùng thử** | 7 ngày đầy đủ tính năng | — | — |
| **Credit khởi tạo** | 100 Credit (1 lần) | Unlimited | Unlimited |
| **Session cơ bản** | ✅ Không giới hạn | ✅ Không giới hạn | ✅ Không giới hạn |
| **Face Detection** | ✅ | ✅ | ✅ |
| **Activity Tracking** | ✅ | ✅ | ✅ |
| **Tab & Screen Tracking** | ✅ | ✅ | ✅ |
| **Goal-based Evaluation** | ✅ | ✅ | ✅ |
| **PDF Certificate (cơ bản)** | ✅ | ✅ | ✅ |
| **AI Analysis (Single Session)** | 🔸 20 Credit/lần | ✅ Unlimited | ✅ Unlimited |
| **AI Trend Analysis (7 ngày)** | 🔸 50 Credit/lần | ✅ Unlimited | ✅ Unlimited |
| **PDF nâng cao (Pie + Bar Chart)** | ❌ | ✅ | ✅ |
| **Voice Note Summary** | ✅ | ✅ | ✅ |
| **Gamification (Streak + Badge)** | ✅ | ✅ | ✅ |
| **QR Code xác thực** | ✅ | ✅ | ✅ |
| **Export CSV/Excel** | ❌ | ✅ | ✅ |
| **Team Dashboard** | ❌ | ❌ | ✅ |
| **Quản lý thành viên** | ❌ | ❌ | ✅ |
| **Báo cáo nhóm tổng hợp** | ❌ | ❌ | ✅ |
| **Custom Branding (PDF)** | ❌ | ❌ | ✅ (logo + tên tổ chức) |
| **Priority Support** | ❌ | ✅ Email | ✅ Email + Chat |
| **Referral Bonus** | +20 Credit/người | +50 Credit/người | +50 Credit/người |

#### 3.2 Chi tiết từng Gói

**Gói Free:**
- Đầy đủ tính năng cốt lõi của v1.0 (session, face detection, activity, tab tracking, goal evaluation, PDF cơ bản, gamification, QR).
- **7 ngày đầu tiên**: trải nghiệm đầy đủ mọi tính năng Pro (bao gồm AI Analysis, PDF nâng cao).
- Sau 7 ngày: AI Analysis và PDF nâng cao chuyển sang dùng Credit.
- Nhận **100 Credit miễn phí 1 lần** (không tự động nạp lại).
- Khi hết Credit → vẫn dùng được session cơ bản, nhưng AI Analysis và Export bị khóa.

**Gói Pro Cá nhân ($4.99/tháng hoặc $49/năm — tiết kiệm 18%):**
- Mọi tính năng không giới hạn.
- AI Analysis (Single Session + Trend 7 ngày) unlimited.
- PDF nâng cao với Pie Chart + Horizontal Bar Chart.
- Export CSV/Excel.
- Priority email support (≤24h).
- Referral bonus: +50 Credit mỗi người giới thiệu thành công.

**Gói Team / Education ($3.99/người/tháng, tối thiểu 5 người):**
- Tất cả tính năng Pro cho mỗi thành viên.
- **Team Dashboard** (web app riêng):
  - Quản lý thành viên (mời qua email / license key).
  - Xem báo cáo tổng hợp nhóm (trung bình focus score, số session, compliance rate).
  - Export báo cáo nhóm (PDF/CSV).
- Custom Branding: logo + tên tổ chức trên PDF Certificate.
- Priority email + chat support (≤4h trong giờ làm việc).

---

### 4. HỆ THỐNG CREDIT

#### 4.1 Quy tắc Credit

| Hành động | Chi phí Credit | Ghi chú |
|---|---|---|
| **AI Analysis — Single Session** | 20 Credit | Phân tích AI cho 1 phiên vừa kết thúc |
| **AI Trend Analysis — 7 ngày** | 50 Credit | Phân tích xu hướng tập trung 7 ngày gần nhất |
| **PDF nâng cao (Pie + Bar Chart)** | 0 Credit (Pro only) | Yêu cầu gói Pro hoặc Team |
| **Export CSV/Excel** | 0 Credit (Pro only) | Yêu cầu gói Pro hoặc Team |

#### 4.2 Cách nhận thêm Credit (Gói Free)

| Nguồn | Credit nhận được | Điều kiện |
|---|---|---|
| Đăng ký mới | +100 Credit | 1 lần duy nhất |
| Referral (mời bạn) | +20 Credit | Bạn bè cài extension + hoàn thành 1 session |
| Hoàn thành streak 7 ngày | +10 Credit | Streak liên tục 7 ngày (mỗi streak chỉ thưởng 1 lần) |
| Đánh giá 5 sao trên Chrome Web Store | +30 Credit | 1 lần duy nhất, xác thực thủ công |

#### 4.3 Logic kiểm tra Credit (Server-side)

```typescript
// Pseudo-code: Credit check trước khi gọi AI (chạy trên Supabase Edge Function)
async function requestAIAnalysis(userId: string, type: 'single' | 'trend') {
  const user = await getUserProfile(userId);

  // Pro/Team → bỏ qua credit check
  if (user.plan === 'pro' || user.plan === 'team') {
    return proceedWithAI(type);
  }

  // Free plan trong trial 7 ngày → bỏ qua credit check
  if (user.plan === 'free' && new Date() < new Date(user.trial_end)) {
    return proceedWithAI(type);
  }

  // Free plan hết trial → kiểm tra credit
  const cost = type === 'single' ? 20 : 50;
  if (user.credits < cost) {
    return { error: 'INSUFFICIENT_CREDITS', required: cost, current: user.credits };
  }

  await deductCreditsAtomic(userId, cost, type); // ATOMIC, server-side
  return proceedWithAI(type);
}
```

#### 4.4 Hiển thị Credit trong Extension

- **Popup Header**: Hiển thị `🔑 Credit: 80` (hoặc `∞` nếu Pro/Team).
- **ResultScreen**: Nút "AI Analysis" hiển thị chi phí: `Phân tích AI (20 Credit)`.
- **HistoryScreen**: Nút "Trend 7 ngày" hiển thị: `Xu hướng 7 ngày (50 Credit)`.
- **Khi Credit ≤ 20**: Badge cảnh báo vàng trên icon extension.

---

### 5. HỆ THỐNG LICENSE KEY & BACKEND (SUPABASE)

#### 5.1 Tại sao chọn Supabase?

| Tiêu chí | Supabase | Firebase | Custom Server |
|---|---|---|---|
| PostgreSQL (relational) | ✅ | ❌ (NoSQL) | Tùy |
| Row Level Security (RLS) | ✅ Native | Phức tạp | Tùy |
| Auth tích hợp | ✅ | ✅ | Tự xây |
| Edge Functions (serverless) | ✅ | ✅ (Cloud Functions) | Tùy |
| Free tier đủ dùng startup | ✅ (50K MAU) | ✅ | ❌ |
| Chi phí mở rộng | Thấp | Trung bình | Cao |

**Quyết định**: Supabase — PostgreSQL quan hệ phù hợp cho Credit/License logic, RLS đảm bảo bảo mật, Edge Functions xử lý payment webhook.

#### 5.2 Database Schema (Supabase PostgreSQL)

```sql
-- Bảng Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  credits INTEGER DEFAULT 100,
  license_key TEXT UNIQUE,
  device_fingerprint TEXT,                       -- Anti-fraud
  trial_start TIMESTAMPTZ DEFAULT NOW(),
  trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) NOT NULL,
  logo_url TEXT,
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Credit Transactions (audit log)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount INTEGER NOT NULL,                       -- Âm = trừ, Dương = cộng
  type TEXT NOT NULL CHECK (type IN (
    'initial', 'ai_single', 'ai_trend', 'referral_bonus',
    'streak_bonus', 'review_bonus', 'purchase', 'admin_adjust'
  )),
  description TEXT,
  balance_after INTEGER NOT NULL,
  idempotency_key TEXT UNIQUE,                   -- Chống duplicate
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng License Keys
CREATE TABLE license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'team')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  device_fingerprints TEXT[],                    -- Tối đa 3 thiết bị
  max_devices INTEGER DEFAULT 3,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  credit_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Session Summaries (cho Team Dashboard)
CREATE TABLE session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  focus_score REAL NOT NULL,
  duration_seconds INTEGER NOT NULL,
  session_mode TEXT,
  camera_used BOOLEAN DEFAULT FALSE,
  goal_compliance_rate REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

#### 5.3 License Key Flow

```
[User mua gói Pro/Team]
        │
        ▼
[Payment Gateway (Stripe/LemonSqueezy)]
        │
        ▼
[Webhook → Supabase Edge Function (idempotent)]
        │
        ├── Tạo license_key record (status: active, expires_at)
        ├── Cập nhật user.plan = 'pro' hoặc 'team'
        └── Gửi email xác nhận + license key
        │
        ▼
[User nhập License Key vào Extension]
        │
        ▼
[Extension thu thập device fingerprint → gửi lên /license/activate]
        │
        ├── Kiểm tra max_devices ≤ 3
        ├── Add fingerprint vào license_keys.device_fingerprints
        ├── Lưu plan vào chrome.storage.local + cache 24h
        └── Unlock tính năng Pro
```

#### 5.4 API Endpoints (Supabase Edge Functions)

| Endpoint | Method | Mô tả |
|---|---|---|
| `/auth/signup` | POST | Đăng ký user mới (email + password) |
| `/auth/login` | POST | Đăng nhập, trả về JWT |
| `/user/profile` | GET | Lấy thông tin user (plan, credits, trial) |
| `/user/credits` | GET | Lấy credit hiện tại + lịch sử transactions |
| `/license/validate` | POST | Validate license key, trả về plan info |
| `/license/activate` | POST | Kích hoạt license key cho user (kiểm tra device limit) |
| `/credits/deduct` | POST | Trừ credit (server-side, atomic, idempotency key) |
| `/credits/add` | POST | Cộng credit (referral, streak, admin) |
| `/referral/generate` | GET | Tạo referral code cho user |
| `/referral/claim` | POST | Claim referral bonus |
| `/team/members` | GET | Danh sách thành viên team |
| `/team/report` | GET | Báo cáo tổng hợp team |
| `/payment/webhook` | POST | Nhận webhook từ Stripe/LemonSqueezy |

#### 5.5 Bảo mật

- **Credit deduction PHẢI server-side**: Extension gửi request → Supabase Edge Function verify JWT → kiểm tra credit → trừ atomic → trả về kết quả. Không bao giờ trừ credit ở client.
- **License validation**: Mỗi lần mở extension → gọi `/license/validate` để sync trạng thái mới nhất. Cache 24 giờ trong `chrome.storage.local` để offline.
- **Rate limiting**: Edge Function giới hạn 60 requests/phút/user.
- **RLS (Row Level Security)**: User chỉ đọc/ghi dữ liệu của chính mình.
- **Idempotency**: Tất cả thao tác trừ/cộng credit và webhook payment đều có idempotency key.

---

### 6. USER FLOW KHI HẾT CREDIT

```
[User nhấn "AI Analysis" hoặc "Trend 7 ngày"]
        │
        ▼
[Extension gửi request → Supabase Edge Function]
        │
        ├── Pro/Team → Gọi AI ngay (không check credit)
        │
        └── Free plan
              │
              ▼
        [Kiểm tra trial (7 ngày đầu)]
              │
              ├── Còn trial → Gọi AI ngay
              │
              └── Hết trial → Kiểm tra credit (atomic)
                    │
                    ├── Đủ credit → Hiện dialog "Dùng 20 Credit?" → Trừ → Gọi AI
                    │
                    └── Không đủ credit
                          │
                          ▼
                    [POPUP CREDIT EXHAUSTED]
                    ┌─────────────────────────────────────┐
                    │  ⚠️  Không đủ Credit                 │
                    │                                     │
                    │  Bạn cần 20 Credit nhưng chỉ còn 5. │
                    │                                     │
                    │  Nâng cấp Pro để dùng AI không      │
                    │  giới hạn chỉ từ $4.99/tháng.       │
                    │                                     │
                    │  [🛒 Mua ngay]  [Mời bạn +20 Credit]│
                    │                                     │
                    │  ──────── hoặc ────────             │
                    │  [Bỏ qua - Tiếp tục không AI]       │
                    └─────────────────────────────────────┘
```

| Nút | Hành động |
|---|---|
| **🛒 Mua ngay** | Mở tab mới → `focusproof.com/pricing` |
| **Mời bạn +20 Credit** | Hiển thị Referral Code + nút Copy + nút Share |
| **Bỏ qua** | Đóng popup, session vẫn có kết quả cơ bản (không AI) |

**Dialog xác nhận khi đủ credit:**

```
┌──────────────────────────────────────┐
│  Xác nhận sử dụng Credit            │
│                                      │
│  Phân tích AI cho phiên này sẽ dùng  │
│  20 Credit. Bạn hiện có 80 Credit.   │
│                                      │
│  Sau khi dùng: còn lại 60 Credit.    │
│                                      │
│  [Xác nhận]          [Hủy]          │
└──────────────────────────────────────┘
```

---

### 7. TRANG WEB BÁN HÀNG (PRICING PAGE) + WIREFRAMES

#### 7.1 Wireframe Pricing Page (Desktop, kiểu GitHub Copilot)

```
╔══════════════════════════════════════════════════════════════════════╗
║  [LOGO FocusProof]   Features  Pricing  Docs  Blog       [Sign In]  ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║          🎯 Chứng minh sự tập trung — bằng dữ liệu thực              ║
║          Một extension nhỏ, một chứng chỉ lớn cho năng suất của bạn  ║
║                                                                      ║
║                  [ ⬇ Cài đặt miễn phí ]                              ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                       💰 Bảng giá đơn giản                           ║
║                                                                      ║
║  ┌────────────────┐  ┌──────────────────┐  ┌───────────────────┐    ║
║  │   🆓 FREE      │  │  ⭐ PRO          │  │   🏢 TEAM/EDU     │    ║
║  │                │  │  ★ Recommended ★ │  │                   │    ║
║  │   $0           │  │   $4.99/tháng    │  │   $3.99/người/th  │    ║
║  │   forever      │  │   $49/năm (-18%) │  │   (≥5 thành viên) │    ║
║  ├────────────────┤  ├──────────────────┤  ├───────────────────┤    ║
║  │ ✅ Session     │  │ ✅ Mọi tính năng │  │ ✅ Mọi tính năng  │    ║
║  │ ✅ Face Det.   │  │ ✅ AI Unlimited  │  │ ✅ Team Dashboard │    ║
║  │ ✅ Activity    │  │ ✅ PDF nâng cao  │  │ ✅ Quản lý nhóm   │    ║
║  │ ✅ Tab Track   │  │ ✅ Export CSV    │  │ ✅ Báo cáo nhóm   │    ║
║  │ ✅ PDF cơ bản  │  │ ✅ Priority      │  │ ✅ Custom Brand   │    ║
║  │ ✅ QR Code     │  │ ✅ Email support │  │ ✅ Priority Chat  │    ║
║  │ 🔸 AI: Credit  │  │                  │  │                   │    ║
║  │ 🎁 7d trial    │  │                  │  │                   │    ║
║  │                │  │                  │  │                   │    ║
║  │ [Dùng miễn phí]│  │ [Bắt đầu ngay]   │  │ [Liên hệ Sales]   │    ║
║  └────────────────┘  └──────────────────┘  └───────────────────┘    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║   ❓ Câu hỏi thường gặp                                              ║
║   ▸ Dữ liệu của tôi có bị thu thập không?                            ║
║   ▸ Có hủy bất cứ lúc nào không?                                     ║
║   ▸ Hỗ trợ trên macOS/Linux không?                                   ║
║   ▸ Học sinh/sinh viên có giảm giá không?                            ║
╠══════════════════════════════════════════════════════════════════════╣
║   © 2026 FocusProof    Privacy   Terms   Contact   GitHub            ║
╚══════════════════════════════════════════════════════════════════════╝
```

#### 7.2 Wireframe Popup "Credit Exhausted"

```
┌────────────────────────────────────────────────┐
│  ⚠️  HẾT CREDIT — KHÔNG THỂ DÙNG AI            │
│ ─────────────────────────────────────────────  │
│                                                │
│   Bạn cần 20 Credit nhưng chỉ còn 5.           │
│   Trial 7 ngày của bạn đã kết thúc.            │
│                                                │
│   ┌──────────────────────────────────────┐     │
│   │  💡 Chỉ $4.99/tháng để dùng AI       │     │
│   │     không giới hạn + PDF nâng cao    │     │
│   └──────────────────────────────────────┘     │
│                                                │
│   [ 🛒 NÂNG CẤP PRO NGAY ]    ← primary       │
│                                                │
│   ┌─────────────────────┐                      │
│   │ 🎁 Mời bạn +20 CR   │   [Bỏ qua]          │
│   └─────────────────────┘                      │
│                                                │
└────────────────────────────────────────────────┘
```

#### 7.3 Thành phần Trang Web

| Section | Nội dung |
|---|---|
| **Hero** | Tagline + CTA "Cài đặt miễn phí" + screenshot extension |
| **How it works** | 3 bước: Cài extension → Bắt đầu session → Nhận chứng chỉ |
| **Pricing** | 3 cột (Free / Pro / Team), cột Pro highlight + badge "Recommended" |
| **Features** | Grid icon: Face Detection, Activity, Tab Tracking, AI Analysis, PDF, QR, Gamification |
| **Use Cases** | Học online, Freelancer, Lập trình viên, Doanh nghiệp |
| **Testimonials** | Quote từ beta users (placeholder ban đầu) |
| **FAQ** | Privacy, data, refund, cancel, student discount |
| **Footer** | Privacy Policy, Terms of Service, Contact, GitHub |

#### 7.4 Tech Stack Trang Web

- **Framework**: Next.js 14 (App Router) hoặc Astro (static)
- **Styling**: Tailwind CSS
- **Payment**: Stripe Checkout hoặc LemonSqueezy
- **Hosting**: Vercel (free tier)
- **Domain**: `focusproof.com` hoặc `focusproof.io`

---

### 8. CẢI TIẾN PDF CERTIFICATE v1.1

#### 8.1 Layout Tổng quan

**Page 1 — Summary & Charts (A4 Landscape)**

```
┌─────────────────────────────────────────────────────────────────┐
│  FOCUSPROOF CERTIFICATE                        [QR Code]       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐ │
│  │             │  │  📋 Session Info                          │ │
│  │   FOCUS     │  │  Task: Deep Work — Programming            │ │
│  │   SCORE     │  │  Goal: Programming Mode                   │ │
│  │   87%       │  │  Duration: 01:30:00                       │ │
│  │ (gradient)  │  │  Camera: ✅ Active                        │ │
│  │             │  │  Allowed Domains: github.com, localhost   │ │
│  │             │  │  Date: 2026-04-18 14:30                   │ │
│  └─────────────┘  └──────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────┐  ┌────────────────────────────────┐   │
│  │  🥧 PIE CHART       │  │  📊 HORIZONTAL BAR CHART       │   │
│  │                     │  │                                │   │
│  │  Compliance         │  │  Face     ████████████░░ 85%   │   │
│  │  Breakdown:         │  │  Activity ██████████████░ 92%   │   │
│  │  🟢 Focused: 72%    │  │  Tab      ████████░░░░░░ 65%   │   │
│  │  🟡 Partial: 18%    │  │  Goal     ███████████░░░ 78%   │   │
│  │  🔴 Off-task: 10%   │  │                                │   │
│  └─────────────────────┘  └────────────────────────────────┘   │
│                                                                 │
│  📈 Timeline: ▁▂▃▅▇█▇▅▃▂▁▂▅▇█▇▅▃▅▇█▇▅▃▂▁▂▃▅▇███▇▅▃▂▁         │
│  Top Domains: github.com (65%), localhost:3000 (25%), ...      │
│  Session Hash: SHA-256: a1b2c3d4...                            │
│  ──── FocusProof Certified • SHA-256 Verified (watermark) ──── │
└─────────────────────────────────────────────────────────────────┘
```

**Page 2 — AI Analysis Only (A4 Landscape)**: Tổng quan, phân tích chi tiết 3 tín hiệu, khuyến nghị, voice note summary (nếu có).

#### 8.2 Pie Chart — Compliance Breakdown

| Trạng thái | Màu sắc | Điều kiện |
|---|---|---|
| **Focused** (Tập trung) | `#22C55E` (xanh lá) | Face present + Activity active + Goal compliant |
| **Partial** (Một phần) | `#F59E0B` (vàng cam) | Có ít nhất 1 tín hiệu positive, không đủ cả 3 |
| **Off-task** (Mất tập trung) | `#EF4444` (đỏ) | Không có tín hiệu nào positive |

**Logic:**

```typescript
function calculateComplianceBreakdown(samples) {
  let focused = 0, partial = 0, offTask = 0;
  for (const s of samples) {
    const score = [s.facePresent, s.activityActive, s.goalCompliant].filter(Boolean).length;
    if (score === 3) focused++;
    else if (score >= 1) partial++;
    else offTask++;
  }
  const total = samples.length;
  return {
    focused: Math.round((focused / total) * 100),
    partial: Math.round((partial / total) * 100),
    offTask: Math.round((offTask / total) * 100),
  };
}
```

#### 8.3 Horizontal Bar Chart — Signal Breakdown

| Signal | Cách tính |
|---|---|
| Face | % samples có facePresent = true |
| Activity | % samples có activityScore > threshold |
| Tab | % samples đang ở allowed domain |
| Goal | % samples isGoalCompliant = true |

**Render**: Dùng Canvas API → `toDataURL()` → `addImage()` vào jsPDF, không cần thư viện chart nặng.

---

### 9. PIE CHART TRONG RESULTSCREEN

Trong `ResultScreen.tsx`, sau Focus Score và trước nút AI Analysis:

```
┌──────────────────────────────────┐
│  Focus Score: 87% (gradient ring)│
│                                  │
│  ┌────────────────────────────┐  │
│  │  🥧 Compliance Breakdown   │  │
│  │  [Pie Chart Canvas]        │  │
│  │  🟢 Focused: 72%           │  │
│  │  🟡 Partial: 18%           │  │
│  │  🔴 Off-task: 10%          │  │
│  └────────────────────────────┘  │
│                                  │
│  [AI Analysis (20 Credit)]       │
│  [Download PDF]                  │
│  [Voice Note]                    │
└──────────────────────────────────┘
```

**Plan gate:**
- Free hết trial → Pie Chart bị blur + overlay "Pro Feature" + nút "Nâng cấp".
- Pro/Team & trong trial → hiển thị đầy đủ.

---

### 10. TEAM DASHBOARD & QUẢN LÝ NHÓM

URL: `focusproof.com/dashboard` (web app riêng, không trong extension).

| Tab | Nội dung |
|---|---|
| **Overview** | Số thành viên, trung bình focus score, tổng số session tuần |
| **Members** | Danh sách thành viên + score TB + streak + last session |
| **Reports** | Bar chart so sánh thành viên, Line chart xu hướng |
| **Settings** | Quản lý thành viên, custom branding, billing |
| **Export** | Download báo cáo nhóm (PDF/CSV) |

**Bảo mật dữ liệu Team:**
- Thành viên **chỉ gửi summary** (score, duration, timestamp) — không gửi dữ liệu chi tiết.
- Admin **không thể xem** nội dung session cụ thể.
- Thành viên có thể **opt-out** khỏi báo cáo nhóm bất cứ lúc nào.

---

### 11. REFERRAL SYSTEM

```
[User A] ──(chia sẻ referral code FP-A3X9K2)──▶ [User B]
                                                     │
                                                     ▼
                                              [User B cài extension]
                                                     │
                                                     ▼
                                              [User B nhập referral code]
                                                     │
                                                     ▼
                                              [User B hoàn thành 1 session ≥ 5 phút]
                                                     │
                                                     ▼
                            ┌────────────────────────────────────┐
                            │ • User A: +20 Credit (Free) hoặc   │
                            │   +50 Credit (Pro)                 │
                            │ • User B: +20 Credit bonus         │
                            │ • Cập nhật referrals.status=completed │
                            └────────────────────────────────────┘
```

| Quy tắc | Chi tiết |
|---|---|
| Format code | `FP-{USER_SHORT_ID}` (ví dụ: `FP-A3X9K2`) |
| Điều kiện hoàn thành | User B cài + hoàn thành ≥ 1 session (≥ 5 phút) |
| Giới hạn referral | Tối đa 50 referrals/user (chống abuse) |
| Self-referral | Chặn: kiểm tra email/device fingerprint |

---

### 12. PHÂN TÍCH ĐỐI THỦ CẠNH TRANH & LỢI THẾ KHÁC BIỆT

#### 12.1 Bảng so sánh đối thủ

| Tiêu chí | **FocusProof** | RescueTime | Forest | Hubstaff/Time Doctor | Cold Turkey | Toggl Track |
|---|---|---|---|---|---|---|
| Loại | Chrome Ext + SaaS | Desktop App | Mobile App | Desktop spy | Block app | Time tracker |
| Đo lường tập trung 3 tín hiệu (Face+Activity+Tab) | ✅ | ❌ | ❌ | Một phần | ❌ | ❌ |
| 100% xử lý local (privacy) | ✅ | ❌ (cloud) | ✅ | ❌ (cloud + screenshots) | ✅ | ❌ |
| Chứng chỉ PDF có **QR + SHA-256** xác thực | ✅ **Duy nhất** | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Analysis cá nhân hóa (GPT) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voice Note Summary | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Goal-based evaluation | ✅ | Một phần | ❌ | ❌ | Một phần | ❌ |
| Không chụp màn hình/keylogger | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Free tier hữu ích | ✅ (7d trial + 100 credit) | ✅ Hạn chế | ✅ | ❌ | ✅ Hạn chế | ✅ Hạn chế |
| Giá Pro | **$4.99/th** | $12/th | $3.99 (one-time) | $7–14/th | $39 (one-time) | $9/th |

#### 12.2 USP (Unique Selling Points)

1. **Chứng chỉ PDF có QR xác thực bằng SHA-256** — không đối thủ nào có. Đặc biệt giá trị cho freelancer chứng minh giờ làm và sinh viên chứng minh thời gian học cho giảng viên.
2. **3-Signal Focus Detection** (Face + Activity + Tab) đánh giá khách quan, không thể giả mạo bằng "wiggle mouse".
3. **Privacy-first triệt để** — không chụp màn hình, không keylogger, không upload data. Đối lập 180° với Hubstaff/Time Doctor.
4. **AI cá nhân hóa khuyến nghị** — không chỉ thống kê, mà phân tích pattern và đề xuất cải thiện.
5. **Goal-based Evaluation** với rules tùy chỉnh cho từng loại task (study/work/programming/video-lecture).
6. **Giá rẻ nhất phân khúc Pro** ($4.99 vs $9–14 của đối thủ).
7. **Open architecture** — Chrome Extension phổ biến nhất, dễ cài, không cần admin permission.

#### 12.3 Định vị thị trường

```
                       Privacy ▲
                               │
                  Forest       │  ◆ FocusProof
                    ●          │     (sweet spot)
                               │
                  Cold Turkey  │
                    ●          │
        ◀──────────────────────┼──────────────────────▶
        Đơn giản               │             Tính năng phong phú
                               │
                  Toggl ●      │  ● RescueTime
                               │
                               │  ● Hubstaff/Time Doctor
                               │     (xâm phạm privacy)
                       Surveillance ▼
```

---

### 13. SỐ LIỆU TÀI CHÍNH CHI TIẾT

#### 13.1 Mô hình doanh thu Năm 1 (Base Case)

| Tháng | Total Users | Free Users | Pro Subs | Team Subs (≥5 ng) | MRR ($) | Doanh thu tháng |
|---|---|---|---|---|---|---|
| M1 (Launch) | 200 | 195 | 5 | 0 | $25 | $25 |
| M2 | 400 | 388 | 12 | 0 | $60 | $60 |
| M3 | 700 | 678 | 22 | 0 | $110 | $110 |
| M4 | 1,100 | 1,065 | 35 | 1×5 | $194 | $194 |
| M5 | 1,500 | 1,450 | 48 | 2×5 | $279 | $279 |
| M6 | 2,000 | 1,925 | 65 | 2×5 | $364 | $364 |
| M7 | 2,500 | 2,400 | 90 | 2×5 | $489 | $489 |
| M8 | 3,000 | 2,880 | 110 | 3×5 | $608 | $608 |
| M9 | 3,500 | 3,355 | 135 | 3×6 | $745 | $745 |
| M10 | 4,000 | 3,820 | 165 | 4×6 | $919 | $919 |
| M11 | 4,500 | 4,295 | 195 | 4×7 | $1,085 | $1,085 |
| M12 | 5,000 | 4,750 | 230 | 5×7 | $1,287 | $1,287 |
| **Tổng năm 1** | | | | | | **~$6,165** |

> **Annualized Run Rate cuối năm 1:** $1,287 × 12 ≈ **$15,440/năm**

#### 13.2 Kịch bản (Best / Base / Worst)

| Kịch bản | MRR cuối năm 1 | ARR | Conversion Free→Pro |
|---|---|---|---|
| **Worst case** | $400 | ~$4,800 | 1.5% |
| **Base case** | $1,287 | ~$15,440 | 4.6% |
| **Best case** | $3,200 | ~$38,400 | 8% + 10 Team accounts |

#### 13.3 Cơ cấu Chi phí (CAPEX + OPEX)

**CAPEX ban đầu (one-time):**

| Khoản mục | Chi phí (USD) |
|---|---|
| Domain (focusproof.com, 1 năm) | $12 |
| Logo & branding design | $50 |
| Chrome Web Store developer fee | $5 |
| Stripe account setup | $0 |
| **Tổng CAPEX** | **~$67** |

**OPEX hàng tháng (theo giai đoạn):**

| Khoản mục | M1–M3 (Free tier) | M4–M9 (Growing) | M10–M12 (Scale) |
|---|---|---|---|
| Supabase | $0 | $0 | $25 (Pro tier) |
| Vercel | $0 | $0 | $20 (Pro tier) |
| OpenAI API (GPT-4o-mini) | ~$5 | ~$20 | ~$60 |
| Stripe phí (2.9% + $0.30) | $1 | $15 | $45 |
| Email (Resend/SendGrid free) | $0 | $0 | $10 |
| Marketing (ads, content) | $0 | $50 | $150 |
| **Tổng OPEX/tháng** | **~$6** | **~$85** | **~$310** |

#### 13.4 Khả năng hoàn vốn (Break-even)

```
Tổng đầu tư 6 tháng đầu: $67 + 6 × $50 (avg OPEX) ≈ $367
Doanh thu 6 tháng: $25+$60+$110+$194+$279+$364 ≈ $1,032
→ Break-even tại tháng 4–5 (kể từ launch)
→ Lợi nhuận ròng năm 1: ~$6,165 - $1,400 ≈ $4,700
```

#### 13.5 Unit Economics

| Metric | Giá trị |
|---|---|
| ARPU Free (Average Revenue Per User) | ~$0.10/tháng (qua referral và review bonus → một phần convert) |
| ARPU Pro | $4.99/tháng |
| ARPU Team (per seat) | $3.99/tháng |
| **CAC** (Customer Acquisition Cost — base) | ~$1.50 (chủ yếu organic + Chrome Web Store) |
| **LTV Pro** (avg lifespan 12 tháng) | $4.99 × 12 = $59.88 |
| **LTV/CAC ratio** | ~40× (rất tốt) |
| **Gross margin** | ~85% (chi phí biến đổi rất thấp) |
| **Churn rate target** | < 8%/tháng |

---

### 14. KIẾN TRÚC HỆ THỐNG v1.1

```
┌─────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Popup   │  │ Content  │  │Offscreen │  │  BG    │ │
│  │  (React) │  │  Script  │  │(Camera)  │  │ Worker │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └──────────────┴──────────────┴─────────────┘    │
│                          │                              │
│                 chrome.storage.local                    │
│                 (session, plan cache, credit cache)     │
└──────────────────────────┬──────────────────────────────┘
                           │
                    HTTPS (JWT Auth)
                           │
┌──────────────────────────┴──────────────────────────────┐
│                     SUPABASE BACKEND                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │   Auth   │  │  PostgreSQL  │  │  Edge Functions   │ │
│  │  (JWT)   │  │  (RLS)       │  │ (Credit/License/  │ │
│  │          │  │              │  │  Webhook/Team)    │ │
│  └──────────┘  └──────────────┘  └───────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │
                    Webhook (POST signed)
                           │
┌──────────────────────────┴──────────────────────────────┐
│                   PAYMENT GATEWAY                        │
│           Stripe Checkout / LemonSqueezy                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                        │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Pricing Page │  │   Team      │  │   Landing     │  │
│  │ (3 cột)      │  │  Dashboard  │  │    Page       │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
│  Tech: Next.js 14 + Tailwind CSS + Vercel               │
└─────────────────────────────────────────────────────────┘
```

---

### 15. RỦI RO & GIẢI PHÁP (BAO GỒM ANTI-FRAUD)

| # | Rủi ro | Xác suất | Tác động | Giải pháp chi tiết |
|---|---|---|---|---|
| 1 | **Bypass credit check** (hack client) | Trung bình | Cao | Credit deduction **server-side bắt buộc** (Edge Function) + JWT verify + rate limit |
| 2 | **License key chia sẻ** (1 mua, 10 người dùng) | Cao | Cao | **Device fingerprint** (canvas + WebGL + UA hash) — tối đa 3 thiết bị/license, kiểm tra mỗi 24h. Vượt limit → khóa thêm thiết bị mới |
| 3 | **Tạo nhiều account để lấy free credit** | Cao | Trung bình | Email verification bắt buộc + device fingerprint + IP rate limit. Referral chỉ award khi user mới hoàn thành ≥1 session ≥5 phút |
| 4 | **Self-referral** (tự giới thiệu chính mình) | Trung bình | Thấp | Check device fingerprint + IP + email domain trùng |
| 5 | **Stripe webhook giả mạo** | Thấp | Cao | Verify webhook signature (`stripe-signature` header) + idempotency key |
| 6 | **Stripe webhook retry → duplicate** | Trung bình | Trung bình | Idempotency key trong webhook handler + UNIQUE constraint trên `payment_intent_id` |
| 7 | **Supabase free tier vượt giới hạn** | Thấp | Trung bình | Monitor usage hàng tuần. Free tier: 50K MAU, 500MB DB. Upgrade Pro $25 khi cần |
| 8 | **GDPR/Privacy compliance** | Trung bình | Cao | Privacy Policy rõ ràng, không thu thập PII ngoài email, cho phép delete account, không bán data |
| 9 | **Conversion rate Free→Pro thấp** | Cao | Cao | Tối ưu trial UX, popup smart timing (sau 3 sessions tốt), A/B test pricing, social proof |
| 10 | **Chrome Web Store reject** | Thấp | Cao | Tuân thủ Chrome Extension Policies, minimal permissions, transparent privacy disclosure |
| 11 | **Đối thủ copy nhanh** | Trung bình | Trung bình | Tốc độ ship + brand + cộng đồng. Patent USP "Certificate hash + QR" nếu có thể |
| 12 | **OpenAI API tăng giá / down** | Thấp | Trung bình | Đa dạng provider (Claude, Gemini fallback), monitor cost/request, optional self-hosted Llama |
| 13 | **Camera permission bị deny → UX kém** | Trung bình | Trung bình | Camera-Off Mode tự động (Activity 60% + Tab 40%) — đã làm trong v1.0 |
| 14 | **Team adoption chậm** | Trung bình | Trung bình | Pilot 3–5 tổ chức (TDTU + 1–2 startup) miễn phí 3 tháng → testimonial → outbound sales |

#### 15.1 Anti-Fraud Strategy (chi tiết)

**Device Fingerprint — Đa lớp:**

```typescript
// src/utils/device-fingerprint.ts
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    await getCanvasFingerprint(),     // Vẽ text + đo pixel hash
    await getWebGLFingerprint(),      // GPU vendor + renderer
    Object.keys(navigator.plugins || {}).join(','),
  ];
  return await sha256(components.join('|'));
}
```

**Server-side enforcement:**
- License key có `max_devices = 3`, mảng `device_fingerprints[]`.
- Mỗi lần extension `validate` → server check fingerprint có trong mảng không. Nếu chưa và `length >= 3` → reject.
- Admin có thể "reset devices" qua dashboard (1 lần/30 ngày).

---

### 16. TÁC ĐỘNG XÃ HỘI & TẦM NHÌN

#### 16.1 Tác động Xã hội

- **Cải thiện năng suất xã hội**: Giúp hàng triệu sinh viên/nhân viên remote tự đo lường và cải thiện tập trung — tiết kiệm thời gian học/làm việc.
- **Bảo vệ quyền riêng tư**: Là phản đề của các phần mềm "spyware" như Hubstaff/Time Doctor. Đặt chuẩn mới: đo lường có thể không xâm phạm.
- **Hỗ trợ giáo dục từ xa**: Sinh viên có thể chứng minh thời gian học cho giảng viên một cách khách quan, đặc biệt với các khóa học online.
- **Hỗ trợ freelancer Việt Nam**: Chứng chỉ giờ làm có xác thực giúp freelancer Việt làm việc với khách quốc tế (Upwork, Fiverr) tăng độ tin cậy.

#### 16.2 Tầm nhìn 3 năm

| Năm | Mục tiêu |
|---|---|
| **Year 1** | 5,000 active users, 230 Pro subs, MRR $1,200, hòa vốn, ra mắt Team |
| **Year 2** | 30,000 active users, 1,500 Pro, 30 Team accounts, MRR $10,000, ra mắt Mobile companion app |
| **Year 3** | 100,000 active users, 5,000 Pro, 100 Team, MRR $35,000, mở rộng sang Edge/Firefox, ra mắt API cho tổ chức |

#### 16.3 Tầm nhìn dài hạn

> *"Trở thành tiêu chuẩn de-facto cho 'productivity proof' trong kỷ nguyên remote work — nơi mọi người có thể chứng minh nỗ lực của mình một cách khách quan, không cần phần mềm xâm phạm quyền riêng tư."*

---

**Tài liệu này là nền tảng ý tưởng cho giai đoạn v1.1. Kế hoạch triển khai chi tiết xem tại `ke_hoach_v1.1.md`.**
