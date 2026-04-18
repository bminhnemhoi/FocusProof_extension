import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useMeta } from '../hooks/useMeta';

interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: 'admin' | 'member';
  focusScore: number;
  sessions7d: number;
  compliance: number;
  status: 'active' | 'pending';
}

const MOCK_TEAM_MEMBERS: TeamMemberRow[] = [
  { id: '1', name: 'Bạn', email: 'you@team.com', initials: 'YO', role: 'admin', focusScore: 91, sessions7d: 18, compliance: 94, status: 'active' },
  { id: '2', name: 'Minh Anh', email: 'minh.anh@team.com', initials: 'MA', role: 'member', focusScore: 87, sessions7d: 14, compliance: 88, status: 'active' },
  { id: '3', name: 'Trần Đức', email: 'tran.duc@team.com', initials: 'TĐ', role: 'member', focusScore: 78, sessions7d: 11, compliance: 81, status: 'active' },
  { id: '4', name: 'Lan Phương', email: 'lan.phuong@team.com', initials: 'LP', role: 'member', focusScore: 84, sessions7d: 16, compliance: 90, status: 'active' },
  { id: '5', name: 'Quốc Bảo', email: 'quoc.bao@team.com', initials: 'QB', role: 'member', focusScore: 72, sessions7d: 9, compliance: 75, status: 'active' },
  { id: '6', name: '— Chờ accept —', email: 'new.member@team.com', initials: '?', role: 'member', focusScore: 0, sessions7d: 0, compliance: 0, status: 'pending' },
];

/**
 * TeamDashboardPage — preview gói Team (Phase 5 trong ke_hoach_v1.1.md).
 * Nếu user chưa phải Team plan: hiển thị overlay upsell.
 */
export default function TeamDashboardPage() {
  const { user, upgradeTo } = useUser();
  const toast = useToast();
  const [inviteEmail, setInviteEmail] = useState('');

  useMeta({
    title: 'Team Dashboard — Quản lý nhóm',
    description:
      'Quản lý nhóm FocusProof Team: mời thành viên, báo cáo focus score, custom branding cho PDF Certificate.',
    canonicalPath: '/team',
  });

  const isTeam = user?.plan === 'team';

  const totalMembers = MOCK_TEAM_MEMBERS.filter((m) => m.status === 'active').length;
  const avgFocusScore = Math.round(
    MOCK_TEAM_MEMBERS.filter((m) => m.status === 'active').reduce((sum, m) => sum + m.focusScore, 0) /
      totalMembers,
  );
  const totalSessions = MOCK_TEAM_MEMBERS.reduce((sum, m) => sum + m.sessions7d, 0);
  const avgCompliance = Math.round(
    MOCK_TEAM_MEMBERS.filter((m) => m.status === 'active').reduce((sum, m) => sum + m.compliance, 0) /
      totalMembers,
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email không hợp lệ', email);
      return;
    }
    toast.success('Đã gửi lời mời', `${email} sẽ nhận email kích hoạt trong 1 phút.`);
    setInviteEmail('');
  };

  const handleUpgradeDemo = async () => {
    await upgradeTo('team');
    toast.success('Đã nâng cấp Team!', 'Bạn có thể quản lý tối đa 50 thành viên.');
  };

  return (
    <div className="container-narrow py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Team Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Quản lý nhóm <span className="font-semibold text-white">FocusProof Team</span> — báo cáo
            tổng hợp, mời thành viên, custom branding.
          </p>
        </div>
        <span className="badge bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30">
          {isTeam ? 'Đang dùng gói Team' : 'Preview (chưa nâng cấp)'}
        </span>
      </div>

      {/* Upsell overlay nếu chưa Team */}
      {!isTeam && (
        <div className="mb-8 rounded-2xl border border-accent-purple/40 bg-gradient-to-br from-accent-purple/10 via-bg-surface to-bg-surface p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-white">🏢 Đây là tính năng dành cho Team</h2>
              <p className="mt-1 text-sm text-slate-400">
                Nâng cấp gói Team chỉ <span className="font-semibold text-white">$3.99</span>/người/tháng (tối thiểu 5 người) để mở khóa toàn bộ Dashboard.
              </p>
            </div>
            <button onClick={handleUpgradeDemo} className="btn-primary shrink-0">
              🧪 Demo: Nâng cấp Team
            </button>
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Thành viên" value={totalMembers.toString()} sub="đang hoạt động" icon="👥" />
        <StatCard label="Focus Score TB" value={`${avgFocusScore}`} sub="/100" icon="🎯" highlight />
        <StatCard label="Sessions 7 ngày" value={totalSessions.toString()} sub="phiên" icon="📊" />
        <StatCard label="Goal Compliance" value={`${avgCompliance}%`} sub="trung bình" icon="✅" />
      </div>

      {/* Members table + Invite */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Members table — span 2 cols */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Thành viên</h2>
            <button
              onClick={() => toast.info('Báo cáo đang được tạo', 'Email sẽ được gửi trong vài phút.')}
              className="btn-ghost text-sm"
            >
              📥 Export báo cáo CSV
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-bg-border bg-bg-elevated/50 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Thành viên</th>
                  <th className="px-4 py-3 text-right font-medium">Focus</th>
                  <th className="px-4 py-3 text-right font-medium">Sessions</th>
                  <th className="px-4 py-3 text-right font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {MOCK_TEAM_MEMBERS.map((m) => (
                  <tr key={m.id} className="hover:bg-bg-elevated/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-purple text-xs font-bold text-white">
                          {m.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {m.name}{' '}
                            {m.role === 'admin' && (
                              <span className="ml-1 badge bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.status === 'pending' ? (
                        <span className="badge bg-accent-amber/15 text-accent-amber ring-1 ring-accent-amber/30">
                          Pending
                        </span>
                      ) : (
                        <ScoreBadge value={m.focusScore} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {m.status === 'pending' ? '—' : m.sessions7d}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {m.status === 'pending' ? '—' : `${m.compliance}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite + Settings */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold text-white">➕ Mời thành viên</h2>
            <p className="mt-1 text-xs text-slate-400">
              Gửi email lời mời. Người được mời nhận license + trial 7 ngày Pro.
            </p>
            <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="thanhvien@congty.com"
                className="rounded-lg border border-bg-border bg-bg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button type="submit" className="btn-primary w-full justify-center" disabled={!isTeam}>
                Gửi lời mời
              </button>
              {!isTeam && <p className="text-xs text-slate-500">Yêu cầu nâng cấp Team.</p>}
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white">🎨 Custom Branding</h2>
            <p className="mt-1 text-xs text-slate-400">
              Logo + tên tổ chức sẽ xuất hiện trên header PDF Certificate của tất cả thành viên.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-bg-border bg-bg text-slate-500">
                ?
              </div>
              <button
                onClick={() => toast.info('Tính năng sắp ra mắt', 'Sẽ có trong Phase 5.')}
                className="btn-secondary"
                disabled={!isTeam}
              >
                Tải logo lên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card ${highlight ? 'border-brand-500/40 bg-brand-500/[0.03]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-white">{value}</span>
        <span className="text-xs text-slate-500">{sub}</span>
      </p>
    </div>
  );
}

function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 85
      ? 'bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30'
      : value >= 70
        ? 'bg-accent-amber/15 text-accent-amber ring-1 ring-accent-amber/30'
        : 'bg-accent-red/15 text-accent-red ring-1 ring-accent-red/30';
  return <span className={`badge font-mono ${color}`}>{value}</span>;
}
