import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dailySeries, summarizeByType } from '../services/transactionStore';
import type { TransactionType } from '../services/transactionStore';

interface CreditChartsProps {
  email: string;
  /** Re-render trigger khi user state đổi (vd: số credit). */
  refreshKey?: number;
}

const TYPE_LABEL: Record<TransactionType, string> = {
  initial: 'Khởi tạo',
  ai_single: 'AI Phân tích',
  ai_trend: 'AI Trend 7 ngày',
  referral_bonus: 'Mời bạn',
  streak_bonus: 'Streak',
  purchase: 'Mua Credit',
  upgrade: 'Nâng cấp Plan',
};

const TYPE_COLOR: Record<TransactionType, string> = {
  initial: '#6366F1',
  ai_single: '#3B82F6',
  ai_trend: '#8B5CF6',
  referral_bonus: '#22C55E',
  streak_bonus: '#F59E0B',
  purchase: '#EC4899',
  upgrade: '#A855F7',
};

export function CreditCharts({ email, refreshKey = 0 }: CreditChartsProps) {
  const pieData = useMemo(
    () =>
      summarizeByType(email)
        .filter((d) => d.total > 0)
        .map((d) => ({
          name: TYPE_LABEL[d.type],
          value: d.total,
          color: TYPE_COLOR[d.type],
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, refreshKey],
  );

  const lineData = useMemo(
    () =>
      dailySeries(email, 14).map((d) => ({
        date: d.date.slice(5), // MM-DD
        spent: d.spent,
        earned: d.earned,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, refreshKey],
  );

  const totalSpent = lineData.reduce((sum, d) => sum + d.spent, 0);
  const totalEarned = lineData.reduce((sum, d) => sum + d.earned, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Daily activity (Area chart) */}
      <div className="card lg:col-span-3">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Hoạt động Credit 14 ngày qua</h3>
            <p className="mt-1 text-xs text-slate-500">
              Đã chi <span className="font-semibold text-accent-red">{totalSpent}</span> · Nhận{' '}
              <span className="font-semibold text-accent-green">+{totalEarned}</span>
            </p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradEarned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1F2937' }}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: '#0F172A',
                  border: '1px solid #1F2937',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#E2E8F0' }}
              />
              <Area
                type="monotone"
                dataKey="earned"
                stroke="#22C55E"
                strokeWidth={2}
                fill="url(#gradEarned)"
                name="Nhận"
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#gradSpent)"
                name="Chi"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown (Pie chart) */}
      <div className="card lg:col-span-2">
        <h3 className="mb-2 text-base font-bold text-white">Phân bổ Credit</h3>
        <p className="text-xs text-slate-500">Tổng hợp theo loại giao dịch</p>
        {pieData.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#0B1220"
                  strokeWidth={2}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid #1F2937',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#E2E8F0' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: '#94A3B8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
