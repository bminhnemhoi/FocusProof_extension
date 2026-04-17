/**
 * Hero section — chỉ là intro ngắn để khung cảnh đẹp trước khi xuống Pricing.
 * Có CTA scroll xuống #pricing.
 */
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="hero-glow relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div className="container-narrow">
        <div className="mx-auto max-w-3xl text-center">
          <span className="badge bg-bg-surface/80 text-slate-300 ring-1 ring-bg-border backdrop-blur">
            🚀 FocusProof v1.1 — Monetization Edition
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Chứng minh sự tập trung
            <br />
            <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-accent-purple bg-clip-text text-transparent">
              bằng dữ liệu thực
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Chrome Extension đo lường tập trung 3 tín hiệu (Camera + Activity + Tab),
            phân tích bằng AI, xuất chứng chỉ PDF có QR xác thực. 100% privacy-first.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/pricing" className="btn-primary px-6 py-3 text-base">
              Xem bảng giá
              <span aria-hidden>→</span>
            </Link>
            <a
              href="https://chrome.google.com/webstore/"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary px-6 py-3 text-base"
            >
              <span aria-hidden>🧩</span>
              Cài đặt từ Chrome Web Store
            </a>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 border-y border-bg-border py-6">
            <Stat label="Privacy-first" value="100%" />
            <Stat label="Tín hiệu đo" value="3" />
            <Stat label="Khởi tạo" value="100" suffix="Credit" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold text-white sm:text-4xl">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
