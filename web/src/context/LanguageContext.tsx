import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { en } from '../i18n/en';
import { vi } from '../i18n/vi';

export type Locale = 'vi' | 'en';

const LOCALE_KEY = 'focusproof.locale.v1';

export type Dictionary = typeof vi;
/** Tất cả translation keys (path-style: "header.signin"). */
export type TranslationKey = NestedKeyOf<Dictionary>;

type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
    : `${K}`;
}[keyof T & (string | number)];

const DICTIONARIES: Record<Locale, Dictionary> = { vi, en };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined') {
    const browser = navigator.language?.toLowerCase() ?? '';
    if (browser.startsWith('en')) return 'en';
  }
  return 'vi';
}

/** Lookup giá trị nested theo path "a.b.c". Trả về undefined nếu miss. */
function lookup(dict: Dictionary, key: string): string | undefined {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

/** Interpolation: "Hello {name}" + {name: "Anh"} → "Hello Anh". */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[locale];
      const fallback = DICTIONARIES.vi;
      const raw = lookup(dict, key) ?? lookup(fallback, key) ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
  return ctx;
}

/** Shortcut hook chỉ trả về `t`. */
export function useT(): LanguageContextValue['t'] {
  return useLanguage().t;
}
