import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useT } from '../context/LanguageContext';
import { LanguageSwitcher, LanguageSwitcherWide } from './LanguageSwitcher';
import type { TranslationKey } from '../context/LanguageContext';

interface HeaderProps {
  onOpenAuth: () => void;
}

interface NavItem {
  to: string;
  i18nKey: TranslationKey;
  end?: boolean;
  authOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', i18nKey: 'nav.home', end: true },
  { to: '/pricing', i18nKey: 'nav.pricing' },
  { to: '/demo', i18nKey: 'nav.demo' },
  { to: '/verify', i18nKey: 'nav.verify' },
  { to: '/team', i18nKey: 'nav.team' },
  { to: '/dashboard', i18nKey: 'nav.dashboard', authOnly: true },
];

export function Header({ onOpenAuth }: HeaderProps) {
  const t = useT();
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const credits = user?.credits ?? 0;
  const plan = user?.plan ?? 'free';
  const isUnlimited = !Number.isFinite(credits);
  const planLabel = plan === 'pro' ? 'PRO' : plan === 'team' ? 'TEAM' : 'FREE';
  const planColor =
    plan === 'pro'
      ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30'
      : plan === 'team'
        ? 'bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30'
        : 'bg-bg-elevated text-slate-400 ring-1 ring-bg-border';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm rounded-md transition-colors ${
      isActive
        ? 'text-white bg-bg-elevated'
        : 'text-slate-300 hover:text-white hover:bg-bg-elevated/60'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
      isActive
        ? 'bg-brand-500/15 text-white ring-1 ring-brand-500/30'
        : 'text-slate-300 hover:bg-bg-elevated hover:text-white'
    }`;

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const visibleItems = NAV_ITEMS.filter((it) => !it.authOnly || isAuthenticated);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-bg-border/60 bg-bg/80 backdrop-blur-xl">
        <div className="container-narrow flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple text-white shadow-glow">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
              </svg>
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-bold text-white">FocusProof</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">v1.1</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {visibleItems.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={navLinkClass}>
                {t(it.i18nKey)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="group flex items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-3 py-1.5 text-sm font-medium transition-all hover:border-brand-500/40 hover:bg-bg-elevated"
                title={t('header.creditDetail')}
              >
                <span aria-hidden className="text-base leading-none">🔑</span>
                <span className="text-slate-300 group-hover:text-white">
                  {isUnlimited ? '∞' : credits.toLocaleString()}
                </span>
                <span className={`badge ${planColor}`}>{planLabel}</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-purple text-xs font-bold text-white"
                  title={user?.email}
                >
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </span>
                <button onClick={handleLogout} className="btn-ghost text-sm">
                  {t('header.logout')}
                </button>
              </div>
            ) : (
              <>
                <button onClick={onOpenAuth} className="btn-ghost hidden sm:inline-flex">
                  {t('header.signin')}
                </button>
                <button onClick={onOpenAuth} className="btn-primary hidden sm:inline-flex">
                  {t('header.signup')}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t('header.openMenu')}
              aria-expanded={mobileOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-bg-border bg-bg-surface text-slate-300 transition-colors hover:border-brand-500/40 hover:text-white md:hidden"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t('header.closeMenu')}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col gap-1 overflow-y-auto border-l border-bg-border bg-bg-surface p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {t('header.menu')}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label={t('common.close')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-bg-elevated hover:text-white"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {visibleItems.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} className={mobileLinkClass}>
                  {t(it.i18nKey)}
                </NavLink>
              ))}
            </nav>

            <div className="mt-6 border-t border-bg-border pt-4">
              <LanguageSwitcherWide />
            </div>

            <div className="mt-6 border-t border-bg-border pt-4">
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-lg bg-bg-elevated/60 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-purple text-sm font-bold text-white">
                      {user?.email?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{user?.email}</p>
                      <p className="text-xs text-slate-500">
                        {planLabel} · {isUnlimited ? '∞' : credits.toLocaleString()} {t('header.credits')}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn-secondary w-full justify-center">
                    {t('header.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onOpenAuth();
                    }}
                    className="btn-secondary w-full justify-center"
                  >
                    {t('header.signin')}
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onOpenAuth();
                    }}
                    className="btn-primary w-full justify-center"
                  >
                    {t('header.signupFree')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
