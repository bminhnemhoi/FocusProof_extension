import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Privacy-first Analytics + Cookie consent.
 *
 * - Không gọi external (mock track → console + localStorage events log).
 * - Ngày Phase Supabase: replace `sendBeacon` chỗ TODO bên dưới.
 * - User opt-in/out lưu localStorage. Track no-op nếu chưa consent.
 */

export type AnalyticsConsent = 'pending' | 'granted' | 'denied';

const CONSENT_KEY = 'focusproof.analytics.consent.v1';
const EVENTS_KEY = 'focusproof.analytics.events.v1';
const MAX_LOCAL_EVENTS = 100;

export interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
  ts: number;
  path: string;
}

interface AnalyticsContextValue {
  consent: AnalyticsConsent;
  grant: () => void;
  deny: () => void;
  reset: () => void;
  track: (name: string, props?: Record<string, string | number | boolean>) => void;
  recentEvents: AnalyticsEvent[];
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function loadConsent(): AnalyticsConsent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* ignore */
  }
  return 'pending';
}

function loadEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_LOCAL_EVENTS) : [];
  } catch {
    return [];
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<AnalyticsConsent>(() => loadConsent());
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>(() => loadEvents());
  const eventsRef = useRef<AnalyticsEvent[]>(recentEvents);

  useEffect(() => {
    eventsRef.current = recentEvents;
  }, [recentEvents]);

  const persistConsent = (c: AnalyticsConsent) => {
    try {
      if (c === 'pending') localStorage.removeItem(CONSENT_KEY);
      else localStorage.setItem(CONSENT_KEY, c);
    } catch {
      /* ignore */
    }
    setConsent(c);
  };

  const grant = useCallback(() => persistConsent('granted'), []);
  const deny = useCallback(() => {
    // Wipe events khi deny
    try {
      localStorage.removeItem(EVENTS_KEY);
    } catch {
      /* ignore */
    }
    setRecentEvents([]);
    persistConsent('denied');
  }, []);
  const reset = useCallback(() => persistConsent('pending'), []);

  const track = useCallback(
    (name: string, props?: Record<string, string | number | boolean>) => {
      // Đọc consent state mới nhất từ localStorage để tránh stale closure
      const c = loadConsent();
      if (c !== 'granted') return;

      const evt: AnalyticsEvent = {
        name,
        props,
        ts: Date.now(),
        path: typeof window !== 'undefined' ? window.location.pathname : '',
      };

      // TODO Phase Supabase: navigator.sendBeacon('/api/track', JSON.stringify(evt))
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[analytics]', name, props);
      }

      const next = [...eventsRef.current, evt].slice(-MAX_LOCAL_EVENTS);
      eventsRef.current = next;
      setRecentEvents(next);
      try {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
      } catch {
        /* quota exceeded — ignore */
      }
    },
    [],
  );

  const value = useMemo<AnalyticsContextValue>(
    () => ({ consent, grant, deny, reset, track, recentEvents }),
    [consent, grant, deny, reset, track, recentEvents],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within <AnalyticsProvider>');
  return ctx;
}

/** Hook tự động track page_view khi pathname đổi. */
export function usePageViewTracker(pathname: string) {
  const { track, consent } = useAnalytics();
  useEffect(() => {
    if (consent !== 'granted') return;
    track('page_view', { path: pathname });
  }, [pathname, consent, track]);
}
