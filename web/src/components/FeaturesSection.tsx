interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: '👁️',
    title: '3-Signal Detection',
    description:
      'Camera (face presence), Activity (keyboard/mouse với IME-aware), Tab tracking realtime. Tổng hợp thành Focus Score chính xác.',
  },
  {
    icon: '🔒',
    title: '100% Privacy-First',
    description:
      'MediaPipe BlazeFace chạy WASM cục bộ. Không screenshot, không keylog, không upload video. Dữ liệu thô không bao giờ rời máy bạn.',
  },
  {
    icon: '🤖',
    title: 'AI Phân tích Cá nhân',
    description:
      'GPT-4o-mini phân tích từng phiên + xu hướng 7 ngày. Đưa ra khuyến nghị cụ thể để cải thiện tập trung.',
  },
  {
    icon: '📜',
    title: 'PDF Certificate có QR',
    description:
      'Chứng chỉ 2 trang với SHA-256 hash + QR Code xác thực. Người nhận quét QR để verify — không thể giả mạo.',
  },
  {
    icon: '🎯',
    title: 'Goal-based Evaluation',
    description:
      'Đặt mục tiêu (deep work / study / coding) với danh sách domain cho phép. Alert realtime khi lệch hướng.',
  },
  {
    icon: '🏆',
    title: 'Gamification',
    description:
      'Streak liên tục, Badge thành tựu, Voice Note Summary. Biến việc tập trung thành thói quen vui.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="container-narrow">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30">
            ⚡ Tính năng nổi bật
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Mọi thứ bạn cần để tập trung
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Đo lường khách quan. Phân tích thông minh. Chứng minh đáng tin.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group card transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-bg-elevated/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated text-2xl ring-1 ring-bg-border transition-colors group-hover:ring-brand-500/40">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
