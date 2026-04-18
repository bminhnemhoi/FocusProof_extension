import { useT } from '../context/LanguageContext';

export function PageLoader() {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t('common.loading')}
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <svg
          className="h-10 w-10 animate-spin text-brand-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" className="opacity-20" />
          <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium text-slate-400">{t('common.loading')}</p>
      </div>
    </div>
  );
}
