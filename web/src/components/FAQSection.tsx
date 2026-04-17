import { useState } from 'react';
import { FAQ_ITEMS } from '../data/faq';

/**
 * FAQ Section — accordion đơn giản, 1 item mở tại 1 thời điểm.
 */
export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="container-narrow">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-accent-purple/10 text-accent-purple ring-1 ring-accent-purple/30">
            ❓ Câu hỏi thường gặp
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Mọi thứ bạn cần biết
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Không tìm thấy câu trả lời? Email{' '}
            <a href="mailto:hello@focusproof.com" className="text-brand-400 hover:underline">
              hello@focusproof.com
            </a>
            .
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl divide-y divide-bg-border rounded-2xl border border-bg-border bg-bg-surface">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-bg-elevated/50"
                >
                  <span className="text-base font-semibold text-white">{item.q}</span>
                  <ChevronIcon
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400 animate-fadeIn">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
      />
    </svg>
  );
}
