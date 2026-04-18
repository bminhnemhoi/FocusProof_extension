import { useLanguage, type Locale } from '../context/LanguageContext';

/**
 * Compact toggle 2 ngôn ngữ — VI / EN. Dùng trong Header.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  const options: { code: Locale; label: string }[] = [
    { code: 'vi', label: 'VI' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="hidden items-center gap-0.5 rounded-lg border border-bg-border bg-bg-surface p-0.5 text-xs font-semibold sm:inline-flex"
    >
      {options.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLocale(opt.code)}
            aria-pressed={active}
            className={`rounded-md px-2 py-1 transition-colors ${
              active
                ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/40'
                : 'text-slate-400 hover:bg-bg-elevated hover:text-white'
            }`}
            title={opt.code === 'vi' ? 'Tiếng Việt' : 'English'}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Variant rộng hơn cho mobile drawer. */
export function LanguageSwitcherWide() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {t('language.label')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(['vi', 'en'] as const).map((code) => {
          const active = locale === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={active}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-brand-500/50 bg-brand-500/15 text-white'
                  : 'border-bg-border bg-bg-surface text-slate-300 hover:bg-bg-elevated'
              }`}
            >
              {t(`language.${code}` as const)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
