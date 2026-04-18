import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useMeta } from '../hooks/useMeta';
import { CreditExhaustedModal } from '../components/CreditExhaustedModal';
import { CreditCharts } from '../components/CreditCharts';
import { ExtensionStatusBadge } from '../components/ExtensionStatusBadge';
import { listTransactions } from '../services/transactionStore';
import type { TransactionType } from '../services/transactionStore';

const TYPE_BADGE: Record<TransactionType, { label: string; cls: string }> = {
  initial: { label: 'Khởi tạo', cls: 'bg-bg-elevated text-slate-400 ring-1 ring-bg-border' },
  ai_single: { label: 'AI', cls: 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30' },
  ai_trend: { label: 'AI Trend', cls: 'bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30' },
  referral_bonus: { label: 'Mời bạn', cls: 'bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30' },
  streak_bonus: { label: 'Streak', cls: 'bg-accent-amber/15 text-accent-amber ring-1 ring-accent-amber/30' },
  purchase: { label: 'Mua', cls: 'bg-accent-momo/15 text-accent-momo ring-1 ring-accent-momo/30' },
  upgrade: { label: 'Upgrade', cls: 'bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30' },
};

export default function DashboardPage() {
  const { user, consumeCredits, addCredits } = useUser();
  const toast = useToast();
  const [exhaustedOpen, setExhaustedOpen] = useState(false);

  useMeta({
    title: 'Dashboard — Credit, License, Referral',
    description: 'Quản lý Credit, License Key và link Referral của bạn.',
    canonicalPath: '/dashboard',
    noindex: true,
  });

  const transactions = useMemo(
    () => (user?.email ? listTransactions(user.email).slice(0, 10) : []),
    // re-compute khi credit đổi (vì transactions ghi từ Context)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.email, user?.credits, user?.plan],
  );

  if (!user) return <Navigate to="/" replace />;

  const isUnlimited = !Number.isFinite(user.credits);
  const referralCode = user.email?.split('@')[0]?.toUpperCase() ?? 'DEMO';
  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;

  const handleTryAI = async () => {
    const ok = await consumeCredits(20, 'AI Analysis — phiên demo từ Dashboard');
    if (!ok) {
      setExhaustedOpen(true);
      return;
    }
    toast.success('Đã trừ 20 Credit', 'AI Analysis sẽ chạy trong extension.');
  };

  const handleTryAITrend = async () => {
    const ok = await consumeCredits(50, 'AI Trend Analysis 7 ngày');
    if (!ok) {
      setExhaustedOpen(true);
      return;
    }
    toast.success('Đã trừ 50 Credit', 'Trend Analysis 7 ngày đã sẵn sàng.');
  };

  const handleAddBonus = async () => {
    await addCredits(10, 'Streak demo +10 từ Dashboard');
    toast.success('+10 Credit', 'Đã cộng vào tài khoản.');
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success('Đã copy link mời bạn!', 'Chia sẻ ngay để nhận +20 Credit/người.');
    } catch {
      toast.info('Copy thủ công', referralUrl);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="container-narrow py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Xin chào <span className="font-semibold text-white">{user.email}</span>. Quản lý Credit, License và Referral của bạn.
        </p>
        <div className="mt-3">
          <ExtensionStatusBadge />
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-6 lg:grid-cols-3">
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
              🧪 Trừ 20 Credit (AI)
            </button>
            <button onClick={handleTryAITrend} className="btn-secondary">
              📈 Trừ 50 Credit (Trend)
            </button>
            <button onClick={handleAddBonus} className="btn-secondary">
              ➕ Cộng 10 Credit
            </button>
            <Link to="/pricing" className="btn-primary">
              Nâng cấp Pro
            </Link>
          </div>

          {user.plan === 'free' && (
            <div className="mt-6 rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-4 text-sm">
              <p className="font-semibold text-accent-amber">⏰ 7 ngày trial Pro miễn phí</p>
              <p className="mt-1 text-slate-400">
                Bạn còn <span className="font-semibold text-white">5 ngày</span> để dùng đầy đủ tính năng Pro mà không tốn Credit.
              </p>
            </div>
          )}
        </div>

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
                FP-PRO-{referralCode.slice(0, 4)}-{Date.now().toString(36).slice(-4).toUpperCase()}-X9K2
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Đã kích hoạt trên <span className="font-semibold text-white">1/3</span> thiết bị.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8">
        <CreditCharts email={user.email ?? 'demo'} refreshKey={transactions.length} />
      </div>

      {/* Referral */}
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

      {/* Transactions */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Lịch sử Credit (10 gần nhất)</h2>
          <span className="text-xs text-slate-500">{transactions.length} giao dịch</span>
        </div>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-bg-border bg-bg-surface/50 p-10 text-center">
            <p className="text-sm text-slate-500">Chưa có giao dịch nào. Thử nhấn các nút demo phía trên.</p>
          </div>
        ) : (
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
                {transactions.map((tx) => {
                  const badge = TYPE_BADGE[tx.type];
                  return (
                    <tr key={tx.id} className="hover:bg-bg-elevated/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{formatDate(tx.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-300">{tx.description}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          tx.amount > 0
                            ? 'text-accent-green'
                            : tx.amount < 0
                              ? 'text-accent-red'
                              : 'text-slate-400'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
