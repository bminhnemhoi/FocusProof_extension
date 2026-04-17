/**
 * FocusProof Web — shared types
 * (Đồng bộ với src/utils/types.ts của extension khi tích hợp Supabase Phase 1.)
 */

export type UserPlan = 'free' | 'pro' | 'team';

export type BillingCycle = 'monthly' | 'yearly';

export interface PricingTier {
  /** Slug duy nhất, dùng cho key & analytics */
  id: 'free' | 'pro' | 'team';
  /** Tên hiển thị */
  name: string;
  /** Mô tả ngắn dưới tên */
  tagline: string;
  /** Giá (USD) — số 0 cho Free */
  priceMonthly: number;
  priceYearly: number;
  /** Đơn vị hiển thị (vd: "/tháng", "/người/tháng") */
  unit: string;
  /** Có badge "Recommended" không */
  recommended?: boolean;
  /** Text nút CTA */
  ctaLabel: string;
  /** Hành động khi nhấn CTA */
  ctaAction: 'signup' | 'buy' | 'contact';
  /** Danh sách feature (dấu ✓) */
  features: string[];
  /** Ghi chú nhỏ phía dưới (vd: "Tối thiểu 5 người") */
  footnote?: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface Testimonial {
  name: string;
  role: string;
  avatarInitials: string;
  quote: string;
}

/** State user (mock — sẽ thay bằng Supabase JWT context khi có backend) */
export interface UserState {
  plan: UserPlan;
  credits: number; // Infinity sẽ render thành ∞
  email?: string;
}
