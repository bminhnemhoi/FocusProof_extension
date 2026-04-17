import { useState } from 'react';
import { Modal } from './Modal';
import { useUser } from '../context/UserContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Mode mặc định khi mở. */
  initialMode?: 'login' | 'signup';
}

/**
 * AuthModal — login/signup mock (chỉ email, không password để demo nhanh).
 * Phase Supabase: thêm password + magic link + email verification.
 */
export function AuthModal({ open, onClose, initialMode = 'signup' }: AuthModalProps) {
  const { signup, login } = useUser();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Email không hợp lệ');
      return;
    }
    if (mode === 'signup') signup(trimmed);
    else login(trimmed);
    setEmail('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      {/* Tabs */}
      <div className="mb-6 flex rounded-lg border border-bg-border bg-bg p-1">
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
            mode === 'signup' ? 'bg-bg-elevated text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Đăng ký
        </button>
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
            mode === 'login' ? 'bg-bg-elevated text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Đăng nhập
        </button>
      </div>

      <h3 className="text-xl font-bold text-white">
        {mode === 'signup' ? 'Tạo tài khoản miễn phí' : 'Chào mừng trở lại'}
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        {mode === 'signup'
          ? 'Nhận 100 Credit + 7 ngày trial Pro miễn phí.'
          : 'Đăng nhập để tiếp tục đo lường tập trung.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Email</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@email.com"
            className="rounded-lg border border-bg-border bg-bg px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>

        {error && (
          <p className="rounded-md bg-accent-red/10 px-3 py-2 text-xs text-accent-red ring-1 ring-accent-red/30">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full justify-center py-3 text-base">
          {mode === 'signup' ? 'Đăng ký & nhận 100 Credit' : 'Đăng nhập'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-bg-border" />
        <span className="text-xs text-slate-500">hoặc</span>
        <div className="h-px flex-1 bg-bg-border" />
      </div>

      {/* Social (mock) */}
      <button
        type="button"
        onClick={() => alert('Google OAuth sẽ được tích hợp ở Phase Supabase Auth.')}
        className="btn-secondary w-full justify-center py-3"
      >
        <span aria-hidden>🔐</span>
        Tiếp tục với Google
      </button>

      <p className="mt-5 text-center text-xs text-slate-500">
        Tiếp tục đồng nghĩa bạn đồng ý với{' '}
        <a href="#" className="text-brand-400 hover:underline">
          Điều khoản
        </a>{' '}
        và{' '}
        <a href="#" className="text-brand-400 hover:underline">
          Privacy
        </a>
        .
      </p>
    </Modal>
  );
}
