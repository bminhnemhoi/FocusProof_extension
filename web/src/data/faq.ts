import type { FAQItem } from '../types';

export const FAQ_ITEMS: FAQItem[] = [
  {
    q: 'FocusProof có thu thập dữ liệu cá nhân không?',
    a: 'Không. 100% dữ liệu phiên (face detection, activity, tab) được xử lý cục bộ trên trình duyệt của bạn. Chúng tôi chỉ đồng bộ summary (focus score, duration) lên server khi bạn dùng gói Team — và bạn có thể opt-out bất cứ lúc nào.',
  },
  {
    q: 'Credit là gì? Khi nào tôi cần dùng?',
    a: 'Credit dùng cho các tính năng AI: AI Analysis Single Session (20 Credit) và AI Trend 7 ngày (50 Credit). Bạn được tặng 100 Credit khi đăng ký, và có thể nhận thêm qua Referral (+20), Streak 7 ngày (+10), Review 5 sao (+30). Gói Pro/Team có Credit không giới hạn.',
  },
  {
    q: 'Tôi có thể dùng Free mãi mãi không?',
    a: 'Có. Sau khi hết 7 ngày trial và 100 Credit, bạn vẫn dùng được toàn bộ tính năng cốt lõi (session, tracking, PDF cơ bản, QR, gamification) miễn phí. Chỉ AI Analysis và PDF nâng cao yêu cầu Credit hoặc gói Pro.',
  },
  {
    q: 'Phương thức thanh toán nào được hỗ trợ?',
    a: 'Tại Việt Nam: Momo (quét QR). Quốc tế: Stripe (Visa, Mastercard, Apple Pay, Google Pay). Sau khi thanh toán, License Key sẽ được gửi vào email của bạn trong vòng 1 phút.',
  },
  {
    q: 'Một License Pro dùng được trên bao nhiêu thiết bị?',
    a: 'Tối đa 3 thiết bị (PC, laptop, máy phụ). Nếu bạn đổi máy mới, có thể "soft re-activate" 1 lần mỗi 30 ngày để chuyển license.',
  },
  {
    q: 'Chứng chỉ PDF có thực sự xác thực được không?',
    a: 'Có. Mỗi PDF chứa SHA-256 hash của dữ liệu phiên + QR Code. Người nhận quét QR → vào trang verify.focusproof.com → đối chiếu hash. Nếu PDF bị chỉnh sửa 1 ký tự, hash sẽ sai và xác thực thất bại.',
  },
  {
    q: 'Tôi có thể hủy gói Pro bất cứ lúc nào không?',
    a: 'Có. Hủy 1 click trong Dashboard. Bạn vẫn dùng Pro đến hết chu kỳ đã thanh toán, sau đó tự động chuyển về Free (giữ nguyên dữ liệu lịch sử).',
  },
  {
    q: 'Gói Team có ưu đãi cho trường học không?',
    a: 'Có. Trường học và tổ chức phi lợi nhuận được giảm 30% (final price $2.79/người/tháng). Gửi email kèm giấy xác nhận tới hello@focusproof.com.',
  },
];
