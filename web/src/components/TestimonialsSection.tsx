import { TESTIMONIALS } from '../data/testimonials';

/**
 * Testimonials — 3 cột, ngắn gọn, không dùng ảnh thật (avatar = initials).
 */
export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 sm:py-24">
      <div className="container-narrow">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-accent-green/10 text-accent-green ring-1 ring-accent-green/30">
            💬 Người dùng nói gì
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Tin tưởng bởi sinh viên & freelancer
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="card flex flex-col gap-4 transition-colors hover:bg-bg-elevated/60"
            >
              <div className="flex gap-1 text-accent-amber" aria-label="5 sao">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-slate-300">
                "{t.quote}"
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-bg-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-purple text-sm font-bold text-white">
                  {t.avatarInitials}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
