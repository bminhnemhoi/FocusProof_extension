import type { PricingTier } from '../types';

/**
 * Pricing tiers — dữ liệu lấy trực tiếp từ y_tuong_v1.1.md mục 3.1.
 * Khi thay đổi giá ở doc, sync lại file này.
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Bắt đầu hành trình tập trung',
    priceMonthly: 0,
    priceYearly: 0,
    unit: 'mãi mãi',
    ctaLabel: 'Cài đặt miễn phí',
    ctaAction: 'signup',
    features: [
      '7 ngày trial đầy đủ tính năng Pro',
      '100 Credit khởi tạo (1 lần duy nhất)',
      'Session không giới hạn (Camera + Activity + Tab)',
      'Goal-based Evaluation realtime',
      'PDF Certificate cơ bản + QR xác thực',
      'Gamification: Streak + Badges',
      'Voice Note Summary',
      'AI Analysis: 20 Credit/lần (sau trial)',
    ],
    footnote: 'Không cần thẻ tín dụng. Đầy đủ tính năng cốt lõi.',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Dành cho cá nhân nghiêm túc',
    priceMonthly: 4.99,
    priceYearly: 49,
    unit: '/tháng',
    recommended: true,
    ctaLabel: 'Mua ngay',
    ctaAction: 'buy',
    features: [
      'Tất cả tính năng Free',
      'AI Analysis Single Session — Unlimited',
      'AI Trend Analysis 7 ngày — Unlimited',
      'PDF nâng cao: Pie Chart + Bar Chart',
      'Export CSV / Excel',
      'Priority Email Support (≤24h)',
      'Referral bonus +50 Credit/người',
      'Sync trên tối đa 3 thiết bị',
    ],
    footnote: 'Tiết kiệm 18% với gói năm ($49/năm).',
  },
  {
    id: 'team',
    name: 'Team / Education',
    tagline: 'Cho tổ chức & lớp học',
    priceMonthly: 3.99,
    priceYearly: 39,
    unit: '/người/tháng',
    ctaLabel: 'Liên hệ mua',
    ctaAction: 'buy',
    features: [
      'Tất cả tính năng Pro cho mỗi thành viên',
      'Team Dashboard quản lý thành viên',
      'Báo cáo nhóm tổng hợp + Export',
      'Custom Branding (logo + tên tổ chức trên PDF)',
      'Priority Email + Chat Support (≤4h)',
      'Quản lý license tập trung',
      'Phân quyền Admin / Member',
      'SLA 99.5% uptime',
    ],
    footnote: 'Tối thiểu 5 người. Liên hệ để báo giá ≥50 người.',
  },
];
