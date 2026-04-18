import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { useT } from '../context/LanguageContext';

export function CookieBanner() {
  const t = useT();
  const { consent, grant, deny } = useAnalytics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const tm = window.setTimeout(() => setMounted(true), 400);
    return () => window.clearTimeout(tm);
  }, []);

  if (consent !== 'pending' || !mounted) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed inset-x-2 bottom-2 z-[55] mx-auto max-w-3xl rounded-2xl border border-bg-border bg-bg-surface/95 p-5 shadow-2xl backdrop-blur-xl animate-fadeIn sm:inset-x-4 sm:bottom-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-2xl ring-1 ring-brand-500/30">
          🍪
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="cookie-title" className="text-base font-bold text-white">
            {t('cookies.title')}
          </h2>
          <p id="cookie-desc" className="mt-1 text-sm leading-relaxed text-slate-400">
            {t('cookies.description')}{' '}
            <Link to="/privacy" className="text-brand-400 hover:underline">
              {t('cookies.privacyLink')}
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button onClick={grant} className="btn-primary w-full justify-center sm:w-auto">
              {t('cookies.accept')}
            </button>
            <button onClick={deny} className="btn-secondary w-full justify-center sm:w-auto">
              {t('cookies.deny')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
