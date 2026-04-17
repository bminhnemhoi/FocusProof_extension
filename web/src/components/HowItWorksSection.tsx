interface Step {
  num: string;
  title: string;
  description: string;
  highlight: string;
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Cài extension & đặt mục tiêu',
    description:
      'Cài FocusProof từ Chrome Web Store, đăng nhập, chọn task + chế độ Goal (Deep Work / Study / Coding) + danh sách domain cho phép.',
    highlight: '~2 phút',
  },
  {
    num: '02',
    title: 'Bắt đầu phiên — chúng tôi đo',
    description:
      '3 tín hiệu chạy song song: Camera (cục bộ), Activity (IME-aware), Tab tracking. Floating widget hiển thị Focus Score realtime, alert khi lệch goal.',
    highlight: 'Realtime',
  },
  {
    num: '03',
    title: 'Nhận chứng chỉ + AI Analysis',
    description:
      'Xem ResultScreen với Pie Chart compliance. Generate PDF Certificate 2 trang có QR xác thực. Tùy chọn AI Analysis để nhận khuyến nghị cá nhân.',
    highlight: 'PDF + QR + AI',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-bg-border bg-bg-surface/30 py-20 sm:py-28">
      <div className="container-narrow">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-accent-green/10 text-accent-green ring-1 ring-accent-green/30">
            🚀 Cách hoạt động
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            3 bước để tập trung
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Từ cài đặt đến chứng chỉ chỉ trong vài phút.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((step, idx) => (
            <div key={step.num} className="relative">
              {/* Connector line (desktop) */}
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-full top-12 hidden h-px w-8 bg-gradient-to-r from-bg-border to-transparent lg:block"
                  style={{ transform: 'translateX(-50%)' }}
                />
              )}

              <div className="card h-full">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-4xl font-extrabold text-bg-border">
                    {step.num}
                  </span>
                  <span className="badge bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30">
                    {step.highlight}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
