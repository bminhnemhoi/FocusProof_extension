# FocusProof — Web (Pricing & Landing)

Trang web bán hàng cho FocusProof v1.1 (Phase 4 trong `ke_hoach_v1.1.md`).

## Tech stack

- **Vite 6** + **React 19** + **TypeScript strict**
- **Tailwind CSS 3** (dark mode mặc định, brand palette tùy biến)
- **qrcode.react** cho QR Momo payment
- Hoàn toàn **client-side** — deploy được lên Vercel / Netlify / Cloudflare Pages chỉ trong vài giây.

## Chạy local

```powershell
cd web
npm install
npm run dev
```

Mở http://localhost:5173

## Build production

```powershell
npm run build
npm run preview   # kiểm tra bản build
```

Output ở `web/dist/` — upload thẳng lên CDN.

## Cấu trúc

```
web/
├─ index.html
├─ tailwind.config.js
├─ vite.config.ts
├─ package.json
└─ src/
   ├─ main.tsx          # Entry
   ├─ App.tsx           # Root + state orchestration
   ├─ index.css         # Tailwind + tokens
   ├─ types.ts          # Shared types (sẽ sync với extension)
   ├─ data/
   │  ├─ pricing.ts     # 3 pricing tiers (Free/Pro/Team)
   │  ├─ faq.ts         # 8 câu hỏi thường gặp
   │  └─ testimonials.ts
   └─ components/
      ├─ Header.tsx              # Logo + nav + Credit balance
      ├─ HeroSection.tsx         # Intro + CTA
      ├─ PricingSection.tsx      # Heading + billing toggle + grid
      ├─ PricingCard.tsx         # 1 cột pricing (GitHub Copilot style)
      ├─ TestimonialsSection.tsx
      ├─ FAQSection.tsx          # Accordion
      ├─ Footer.tsx
      ├─ Modal.tsx               # Modal base (ESC + backdrop close)
      ├─ QRPaymentModal.tsx      # Quét QR Momo + hướng dẫn
      └─ CreditExhaustedModal.tsx # Popup hết credit (3 lựa chọn)
```

## Tính năng đã làm

### Phase 1 — Pricing Page
- [x] Dark mode mặc định, responsive (mobile / tablet / desktop)
- [x] Header với Credit balance + Plan badge ở góc phải
- [x] 3 pricing cards: Free / Pro (recommended) / Team — kiểu GitHub Copilot
- [x] Billing toggle Hàng tháng / Hàng năm (-18%)
- [x] Modal QR Momo (deeplink `momo://transfer`) — sẵn sàng đổi sang QR động
- [x] Modal Credit Exhausted với 3 CTA: Mua ngay / Mời bạn / Bỏ qua
- [x] Section FAQ (accordion)
- [x] Section Testimonials (3 cột)
- [x] Footer
- [x] Hero section với gradient glow

### Phase 2 — Multi-page + Auth + Dashboard
- [x] React Router 7 (BrowserRouter) — 5 routes: `/`, `/pricing`, `/dashboard`, `/verify`, 404
- [x] `UserContext` + `useUser()` hook — state persist trong `localStorage` (signup/login/logout/consumeCredits/addCredits/upgradeTo)
- [x] AuthModal (signup/login mock — chỉ email cho demo nhanh)
- [x] HomePage: Hero + Features grid (6 items) + How it works (3 steps) + Testimonials + CTA
- [x] DashboardPage: Credit balance card + License key + Referral với link copy + Lịch sử Credit (transactions table)
- [x] VerifyPage: form nhập SHA-256 hash → mock validate → hiển thị metadata
- [x] Layout component bọc Header + Outlet + Footer + AuthModal global
- [x] Header thông minh: hiển thị nav khác nhau khi login vs guest, avatar, logout
- [x] QRPaymentModal có nút "🧪 Demo: Mô phỏng thanh toán thành công" để test upgrade flow
- [x] 404 NotFoundPage

## Bước tiếp theo (Phase 3+)

- [ ] Tích hợp **Supabase Auth** → thay `localStorage` trong `UserContext` bằng `supabase.auth`
- [ ] **QR Momo động** — `/payment/create-session` Edge Function trả về `payUrl` + `orderId`
- [ ] **Stripe Checkout** cho thị trường quốc tế (parallel Momo)
- [ ] **Verify backend**: POST `/verify` với hash → tra `session_summaries` thật
- [ ] **Team Dashboard** route `/team` (Phase 5 trong ke_hoach_v1.1.md)
- [ ] **Multi-language** (vi / en) — i18next
- [ ] **SEO**: Open Graph image, sitemap, robots.txt, GA4
- [ ] **Lighthouse ≥ 90** (perf/a11y/seo)
- [ ] Hash routing cho Verify (`/verify?hash=FP-...` đã hỗ trợ qua `useSearchParams`)

## QR Momo — chuyển từ tĩnh sang động

File [`src/components/QRPaymentModal.tsx`](src/components/QRPaymentModal.tsx):

```ts
function buildMomoPayload(amountUSD: number, orderId: string): string {
  // ... hiện tại sinh `momo://transfer?phone=...&amount=...&note=...`
}
```

Khi có Supabase Edge Function `/payment/create-session`:

```ts
const session = await fetch('/api/payment/create-session', {
  method: 'POST',
  body: JSON.stringify({ tierId: tier.id, cycle }),
}).then(r => r.json());
// session.qrCodeUrl  → render trực tiếp <img src={session.qrCodeUrl}/>
// session.orderId    → hiển thị + dùng cho webhook activate license
```

Chỉ cần thay logic trong `useMemo(...)` — phần UI giữ nguyên.

## Khớp với tài liệu

- Pricing & features: `docs/v1.1_monetization_startup/y_tuong_v1.1.md` mục 3.1, 4.
- User flow hết Credit: cùng file mục 6 (3 lựa chọn).
- Roadmap: `docs/v1.1_monetization_startup/ke_hoach_v1.1.md` Phase 4 (Week 7).
