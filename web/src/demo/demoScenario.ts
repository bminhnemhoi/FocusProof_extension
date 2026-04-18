/**
 * Demo orchestrator — kịch bản auto-play cho /demo route.
 * Phát một chuỗi "scene" giả lập user journey: signup → consume → exhausted → upgrade → certificate.
 *
 * Không phụ thuộc vào UserContext/transactionStore (tự simulate state cục bộ),
 * để tránh side-effect lên session thật của giám khảo.
 */

export type DemoSceneId =
  | 'intro'
  | 'signup'
  | 'install'
  | 'session'
  | 'analyze'
  | 'streak'
  | 'invite'
  | 'exhausted'
  | 'upgrade'
  | 'unlimited'
  | 'certificate'
  | 'outro';

export interface DemoScene {
  id: DemoSceneId;
  /** Thời lượng scene (ms). */
  duration: number;
  title: string;
  caption: string;
  /** Hành động mô phỏng — apply lên DemoState khi scene bắt đầu. */
  apply?: (s: DemoState) => DemoState;
  /** Highlight UI block nào. */
  highlight: 'auth' | 'extension' | 'credit' | 'pricing' | 'certificate' | 'none';
}

export interface DemoState {
  email: string | null;
  plan: 'free' | 'pro';
  credits: number; // Number.POSITIVE_INFINITY for pro
  sessionMinutes: number;
  focusScore: number; // 0-100
  certificateIssued: boolean;
  log: string[];
}

export const INITIAL_STATE: DemoState = {
  email: null,
  plan: 'free',
  credits: 0,
  sessionMinutes: 0,
  focusScore: 0,
  certificateIssued: false,
  log: [],
};

const log = (s: DemoState, msg: string): DemoState => ({
  ...s,
  log: [...s.log, `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}`].slice(-12),
});

export const SCENES: DemoScene[] = [
  {
    id: 'intro',
    duration: 3500,
    title: 'FocusProof Demo · 60 giây',
    caption: 'Đi qua hành trình hoàn chỉnh: từ đăng ký đến chứng chỉ tập trung có QR xác thực.',
    highlight: 'none',
  },
  {
    id: 'signup',
    duration: 4000,
    title: '1️⃣ Đăng ký miễn phí',
    caption: 'User tạo tài khoản với email — nhận 100 Credit + 7 ngày trial Pro tự động.',
    apply: (s) => log({ ...s, email: 'demo@tdtu.edu.vn', credits: 100 }, 'Tạo tài khoản: demo@tdtu.edu.vn (+100 Credit)'),
    highlight: 'auth',
  },
  {
    id: 'install',
    duration: 3500,
    title: '2️⃣ Cài extension Chrome',
    caption: 'Cài 1 click từ Web Store. Extension đăng nhập qua chrome.identity, sync Credit qua Edge Function.',
    apply: (s) => log(s, 'Cài extension thành công, sync Credit'),
    highlight: 'extension',
  },
  {
    id: 'session',
    duration: 5500,
    title: '3️⃣ Bắt đầu session học 35 phút',
    caption: 'Đo 3 tín hiệu real-time: Camera (face presence) + Activity (keyboard/mouse) + Tab (whitelist).',
    apply: (s) => log({ ...s, sessionMinutes: 35, focusScore: 87 }, 'Hoàn tất session 35 phút · Score 87/100'),
    highlight: 'extension',
  },
  {
    id: 'analyze',
    duration: 4500,
    title: '4️⃣ AI Analysis (−20 Credit)',
    caption: 'Gemini Nano phân tích pattern, gợi ý cải thiện. Giá 20 Credit/lần (Pro: miễn phí).',
    apply: (s) => log({ ...s, credits: s.credits - 20 }, 'AI Analysis: −20 Credit (còn 80)'),
    highlight: 'credit',
  },
  {
    id: 'streak',
    duration: 4000,
    title: '5️⃣ Streak +10 Credit',
    caption: 'Hoàn thành 3 session liên tiếp → bonus +10 Credit. Gamification giữ chân user.',
    apply: (s) => log({ ...s, credits: s.credits + 10 }, 'Streak 3 ngày: +10 Credit (còn 90)'),
    highlight: 'credit',
  },
  {
    id: 'invite',
    duration: 4000,
    title: '6️⃣ Mời bạn (Referral)',
    caption: 'Bạn @minh.anh cài extension qua link giới thiệu → cả 2 nhận +20 Credit.',
    apply: (s) => log({ ...s, credits: s.credits + 20 }, 'Referral @minh.anh: +20 Credit (còn 110)'),
    highlight: 'credit',
  },
  {
    id: 'exhausted',
    duration: 5000,
    title: '7️⃣ Hết trial → Credit gần cạn',
    caption: 'Sau 7 ngày trial Pro, user dùng nhiều AI → còn 5 Credit. Pop-up Credit Exhausted xuất hiện.',
    apply: (s) => log({ ...s, credits: 5 }, 'Hết trial Pro · Còn 5 Credit'),
    highlight: 'credit',
  },
  {
    id: 'upgrade',
    duration: 5500,
    title: '8️⃣ Quét QR Momo nâng cấp Pro',
    caption: 'Thanh toán $4.99/tháng qua Momo. Webhook xác nhận → license activate trên 3 thiết bị.',
    apply: (s) => log(s, 'Mở QR Momo · $4.99 ≈ 127.500đ'),
    highlight: 'pricing',
  },
  {
    id: 'unlimited',
    duration: 4000,
    title: '9️⃣ Pro · Credit không giới hạn',
    caption: 'Tài khoản nâng cấp Pro: badge PRO, ∞ Credit, AI Analysis miễn phí mọi session.',
    apply: (s) => log({ ...s, plan: 'pro', credits: Number.POSITIVE_INFINITY }, '🎉 Nâng cấp PRO thành công · ∞ Credit'),
    highlight: 'pricing',
  },
  {
    id: 'certificate',
    duration: 5500,
    title: '🔟 Xuất chứng chỉ PDF có QR',
    caption: 'PDF 2 trang: Score breakdown + AI Analysis. QR xác thực public verify trên focusproof.com/verify.',
    apply: (s) => log({ ...s, certificateIssued: true }, 'Xuất PDF Certificate · Hash SHA-256 đã ghi'),
    highlight: 'certificate',
  },
  {
    id: 'outro',
    duration: 4000,
    title: '✅ Demo hoàn tất',
    caption: 'FocusProof: bằng chứng tập trung tin cậy, privacy-first, monetization rõ ràng.',
    highlight: 'none',
  },
];

export const TOTAL_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);
