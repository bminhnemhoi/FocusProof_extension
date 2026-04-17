import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface HeaderProps {
  /** Mở AuthModal khi click "Đăng nhập" hoặc "Đăng ký". */
  onOpenAuth: () => void;
}

/**
 * Sticky header — logo + nav (NavLink active) + Credit balance + auth controls.
 * Khi đã login: hiển thị Credit pill (link sang /dashboard) + avatar + Đăng xuất.
 * Khi chưa login: nút Đăng nhập + Đăng ký mở AuthModal.
 */
export function Header({ onOpenAuth }: HeaderProps) {
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-bg-border/60 bg-bg/80 backdrop-blur-xl">
      <div className="container-narrow flex h-16 items-center justify-between gap-4">
        {/* Logo */}
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

        {/* Nav (desktop) */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
          <NavLink to="/verify" className={navLinkClass}>
            Verify
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="group flex items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-3 py-1.5 text-sm font-medium transition-all hover:border-brand-500/40 hover:bg-bg-elevated"
              title="Xem chi tiết Credit"
            >
              <span aria-hidden className="text-base leading-none">🔑</span>
              <span className="text-slate-300 group-hover:text-white">
                {isUnlimited ? '∞' : credits.toLocaleString('vi-VN')}
              </span>
              <span className={`badge ${planColor}`}>{planLabel}</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span
                className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-purple text-xs font-bold text-white sm:flex"
                title={user?.email}
              >
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
              <button onClick={handleLogout} className="btn-ghost text-sm" title="Đăng xuất">
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <button onClick={onOpenAuth} className="btn-ghost hidden sm:inline-flex">
                Đăng nhập
              </button>
              <button onClick={onOpenAuth} className="btn-primary">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
