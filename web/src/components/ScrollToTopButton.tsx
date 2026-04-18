import { useEffect, useState } from 'react';
import { useT } from '../context/LanguageContext';

export function ScrollToTopButton() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('scrollToTop')}
      title={t('scrollToTop')}
      className="fixed bottom-6 left-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-bg-border bg-bg-surface/90 text-slate-300 shadow-2xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-bg-elevated hover:text-white animate-fadeIn"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832l-3.71 3.938a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
