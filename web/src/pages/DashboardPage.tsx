import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { CreditExhaustedModal } from '../components/CreditExhaustedModal';

interface CreditTransaction {
  id: string;
  type: 'initial' | 'ai_single' | 'ai_trend' | 'referral_bonus' | 'streak_bonus' | 'purchase';
  amount: number;
  description: string;
  createdAt: string;
}

// Mock transactions — Phase Supabase: fetch /user/credits → transactions[]
const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: '1', type: 'initial', amount: 100, description: 'Tặng khi đăng ký', createdAt: '2026-04-11' },
  { id: '2', type: 'ai_single', amount: -20, description: 'AI Analysis — phiên 35 phút Coding', createdAt: '2026-04-12' },
  { id: '3', type: 'streak_bonus', amount: 10, description: 'Streak 7 ngày liên tục 🔥', createdAt: '2026-04-13' },
  { id: '4', type: 'ai_single', amount: -20, description: 'AI Analysis — phiên Deep Work', createdAt: '2026-04-15' },
  { id: '5', type: 'ai_trend', amount: -50, description: 'AI Trend Analysis 7 ngày', createdAt: '2026-04-16' },
  { id: '6', type: 'referral_bonus', amount: 20, description: 'Bạn @minh.anh đã cài + hoàn thành session', createdAt: '2026-04-17' },
];

export default function DashboardPage() {
  const { user, consumeCredits, addCredits } = useUser();
  const [exhaustedOpen, setExhaustedOpen] = useState(false);

  // Guard: chưa login → về trang chủ
  if (!user) return <Navigate to="/" replace />;

  const isUnlimited = !Number.isFinite(user.credits);
  const referralCode = user.email?.split('@')[0]?.toUpperCase() ?? 'DEMO';
  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;

  /** Demo: thử dùng AI (trừ 20 credit). */
  const handleTryAI = () => {
    const ok = consumeCredits(20);
    if (!ok) {
      setExhaustedOpen(true);
      return;
    }
    alert('✓ Đã trừ 20 Credit. AI Analysis sẽ chạy trong extension.');
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      alert('Đã copy link!');
    } catch {
      alert(referralUrl);
    }
  };

  return (
    <div className="container-narrow py-12 sm:py-16">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Xin chào <span className="font-semibold text-white">{user.email}</span>. Quản lý Credit, License và Referral của bạn.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Credit balance */}
        <div className="card lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Credit hiện tại</p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-white">
                  {isUnlimited ? '∞' : user.credits.toLocaleString('vi-VN')}
                </span>
                <span className="text-sm text-slate-400">
                  {isUnlimited ? 'Unlimited (Pro)' : 'Credit'}
                </span>
              </p>
            </div>
            <span
              className={`badge ${
                user.plan === 'pro'
                  ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30'
                  : user.plan === 'team'
                    ? 'bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30'
                    : 'bg-bg-elevated text-slate-400 ring-1 ring-bg-border'
              }`}
            >
              Gói {user.plan.toUpperCase()}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={handleTryAI} className="btn-secondary">
              🧪 Demo: trừ 20 Credit (AI)
            </button>
            <button onClick={() => addCredits(10)} className="btn-secondary">
              ➕ Demo: cộng 10 Credit
            </button>
            <Link to="/pricing" className="btn-primary">
              Nâng cấp Pro
            </Link>
          </div>

          {/* Trial bar (chỉ hiển thị Free) */}
          {user.plan === 'free' && (
            <div className="mt-6 rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-4 text-sm">
              <p className="font-semibold text-accent-amber">⏰ 7 ngày trial Pro miễn phí</p>
              <p className="mt-1 text-slate-400">
                Bạn còn <span className="font-semibold text-white">5 ngày</span> để dùng đầy đủ tính năng Pro mà không tốn Credit.
              </p>
            </div>
          )}
        </div>

        {/* License key card */}
        <div className="card">
          <p className="text-sm font-medium text-slate-400">License Key</p>
          {user.plan === 'free' ? (
            <>
              <p className="mt-2 font-mono text-sm text-slate-500">— Chưa có —</p>
              <p className="mt-3 text-xs text-slate-500">
                Nâng cấp Pro để nhận License Key kích hoạt extension trên tối đa 3 thiết bị.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 break-all rounded-md bg-bg p-3 font-mono text-sm text-brand-400">
                FP-PRO-XXXX-YYYY-ZZZZ
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Đã kích hoạt trên <span className="font-semibold text-white">1/3</span> thiết bị.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Referral section */}
      <div className="mt-8 card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">🎁 Mời bạn bè</h2>
            <p className="mt-1 text-sm text-slate-400">
              Mỗi người bạn cài extension + hoàn thành 1 session ≥5 phút, cả 2 cùng nhận{' '}
              <span className="font-semibold text-accent-green">+20 Credit</span> (Pro: +50).
            </p>
          </div>
          <span className="badge bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30">
            Code: {referralCode}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="flex-1 rounded-lg border border-bg-border bg-bg px-3 py-2.5 font-mono text-sm text-slate-300"
          />
          <button onClick={handleCopyReferral} className="btn-primary">
            Copy link
          </button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-white">Lịch sử Credit</h2>
        <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-bg-border bg-bg-elevated/50 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Ngày</th>
                <th className="px-4 py-3 font-medium">Mô tả</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {MOCK_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-bg-elevated/30">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{tx.createdAt}</td>
                  <td className="px-4 py-3 text-slate-300">{tx.description}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-bg-elevated text-slate-400 ring-1 ring-bg-border">
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold ${
                      tx.amount > 0 ? 'text-accent-green' : 'text-accent-red'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreditExhaustedModal
        open={exhaustedOpen}
        onClose={() => setExhaustedOpen(false)}
        currentCredits={user.credits}
        feature="ai_single"
        onBuyNow={() => {
          setExhaustedOpen(false);
          window.location.href = '/pricing';
        }}
        onInviteFriends={handleCopyReferral}
      />
    </div>
  );
}
