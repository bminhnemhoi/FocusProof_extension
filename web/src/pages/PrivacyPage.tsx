import { useMeta } from '../hooks/useMeta';

interface PolicyPageProps {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: { title: string; body: React.ReactNode }[];
}

/**
 * Layout chung cho Privacy Policy và Terms of Service.
 */
export function PolicyPage({ title, effectiveDate, intro, sections }: PolicyPageProps) {
  return (
    <div className="container-narrow py-16 sm:py-24">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Áp dụng từ: {effectiveDate}</p>
        <p className="mt-6 text-lg leading-relaxed text-slate-300">{intro}</p>

        <div className="mt-10 space-y-10">
          {sections.map((s, idx) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold text-white">
                <span className="font-mono text-slate-500">{String(idx + 1).padStart(2, '0')}.</span>{' '}
                {s.title}
              </h2>
              <div className="prose-invert mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-bg-border pt-6 text-sm text-slate-500">
          Có câu hỏi? Email{' '}
          <a href="mailto:hello@focusproof.com" className="text-brand-400 hover:underline">
            hello@focusproof.com
          </a>
          .
        </p>
      </article>
    </div>
  );
}

export default function PrivacyPage() {
  useMeta({
    title: 'Privacy Policy — 100% Privacy-first',
    description:
      'FocusProof không screenshot, không log keystroke, không upload camera. Face detection chạy 100% cục bộ qua MediaPipe WASM. Đọc chi tiết Privacy Policy.',
    canonicalPath: '/privacy',
  });
  return (
    <PolicyPage
      title="Privacy Policy"
      effectiveDate="18/04/2026"
      intro="FocusProof được xây dựng theo triết lý privacy-first. Chúng tôi tin rằng dữ liệu tập trung của bạn thuộc về bạn — không thuộc về chúng tôi, không thuộc về quảng cáo."
      sections={[
        {
          title: 'Dữ liệu chúng tôi KHÔNG thu thập',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Không screenshot màn hình của bạn.</li>
              <li>Không log keystroke (chỉ đếm số lần gõ phím, không nội dung).</li>
              <li>Không upload video/ảnh từ camera (face detection chạy 100% cục bộ qua MediaPipe WASM).</li>
              <li>Không thu thập lịch sử duyệt web ngoài phiên làm việc đang chạy.</li>
              <li>Không bán hoặc chia sẻ dữ liệu với bên thứ ba cho mục đích quảng cáo.</li>
            </ul>
          ),
        },
        {
          title: 'Dữ liệu chúng tôi thu thập',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Email khi đăng ký (xác thực + gửi license key).</li>
              <li>
                Session summary (chỉ <em>focus_score, duration, mode</em> — không có dữ liệu thô)
                khi bạn dùng gói Team và đã opt-in.
              </li>
              <li>Device fingerprint (canvas + WebGL + UA hash) để chống chia sẻ license &gt; 3 thiết bị.</li>
              <li>Số Credit và lịch sử transactions để billing.</li>
            </ul>
          ),
        },
        {
          title: 'Lưu trữ dữ liệu',
          body: (
            <p>
              Dữ liệu phiên (timeline, samples) lưu trong <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs">chrome.storage.local</code> trên máy bạn — không bao giờ rời máy. Dữ liệu account (email, plan, credit) lưu trong PostgreSQL của Supabase tại EU/US, mã hóa at-rest.
            </p>
          ),
        },
        {
          title: 'Quyền của bạn',
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Yêu cầu export toàn bộ dữ liệu account (GDPR Right to Access).</li>
              <li>Yêu cầu xóa account (GDPR Right to be Forgotten) — xử lý trong 30 ngày.</li>
              <li>Tắt sync session_summary với Team bất cứ lúc nào trong Settings.</li>
            </ul>
          ),
        },
        {
          title: 'Cookies',
          body: (
            <p>
              Trang web focusproof.com chỉ dùng cookies kỹ thuật cần thiết (auth session). Không
              dùng tracking cookies, không Google Analytics nếu bạn opt-out qua banner.
            </p>
          ),
        },
        {
          title: 'Liên hệ DPO',
          body: (
            <p>
              Data Protection Officer:{' '}
              <a href="mailto:dpo@focusproof.com" className="text-brand-400 hover:underline">
                dpo@focusproof.com
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
