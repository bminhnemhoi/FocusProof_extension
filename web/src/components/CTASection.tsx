import { Link } from 'react-router-dom';
import { useT } from '../context/LanguageContext';

interface CTASectionProps {
  onSignup: () => void;
  isAuthenticated: boolean;
}

export function CTASection({ onSignup, isAuthenticated }: CTASectionProps) {
  const t = useT();
  return (
    <section className="py-20 sm:py-24">
      <div className="container-narrow">
        <div className="relative overflow-hidden rounded-3xl border border-bg-border bg-gradient-to-br from-bg-surface via-bg-elevated to-bg-surface p-10 shadow-card sm:p-16">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-purple/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-400">{t('cta.subtitle')}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary px-6 py-3 text-base">
                  {t('cta.ctaAuth')}
                </Link>
              ) : (
                <button onClick={onSignup} className="btn-primary px-6 py-3 text-base">
                  {t('cta.ctaGuest')}
                </button>
              )}
              <Link to="/pricing" className="btn-secondary px-6 py-3 text-base">
                {t('cta.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
