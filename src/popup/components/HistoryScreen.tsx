/**
 * FocusProof – HistoryScreen Component
 * Hiển thị lịch sử phiên tập trung, badges tổng hợp.
 * Features: 7-day heatmap, filter by mode, export CSV.
 *
 * Reference: y_tuong.md Section 2.3 – Lịch sử & Báo cáo
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { SessionData, SessionMode } from '@/utils/types';
import { getGrade } from '@/utils/focus';
import { storage } from '@/utils/storage';

interface HistoryScreenProps {
  onBack: () => void;
  onViewResult: (session: SessionData) => void;
}

const MODE_LABELS: Record<SessionMode, string> = {
  study: '📚 Học tập',
  work: '💼 Làm việc',
  programming: '💻 Lập trình',
  'video-lecture': '🎥 Video',
};

/** Tạo dữ liệu heatmap 7 ngày gần nhất */
function buildHeatmap(sessions: SessionData[]) {
  const days: { label: string; date: string; count: number; avgScore: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const daySessions = sessions.filter(
      (s) => new Date(s.startTime).toISOString().slice(0, 10) === dateStr,
    );
    const avg =
      daySessions.length > 0
        ? Math.round(daySessions.reduce((sum, s) => sum + (s.finalScore ?? 0), 0) / daySessions.length)
        : 0;
    days.push({
      label: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
      date: dateStr,
      count: daySessions.length,
      avgScore: avg,
    });
  }
  return days;
}

function heatmapColor(score: number, count: number): string {
  if (count === 0) return 'var(--bg-secondary)';
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

/** Export sessions to CSV */
function exportCSV(sessions: SessionData[]) {
  const header = 'ID,Task,Mode,Start,End,Duration(min),Score,Camera,Samples\n';
  const rows = sessions.map((s) => {
    const start = new Date(s.startTime).toISOString();
    const end = s.endTime ? new Date(s.endTime).toISOString() : '';
    const dur = s.endTime ? Math.round((s.endTime - s.startTime) / 60000) : s.config.durationMinutes;
    const score = Math.round(s.finalScore ?? 0);
    return `${s.id},"${s.config.taskName}",${s.config.mode},${start},${end},${dur},${score},${s.config.cameraEnabled},${s.samples.length}`;
  });

  const csv = header + rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FocusProof_History_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryScreen({ onBack, onViewResult }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [badges, setBadges] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<SessionMode | 'all'>('all');

  useEffect(() => {
    (async () => {
      const [history, allBadges] = await Promise.all([
        storage.getSessionHistory(),
        storage.getBadges(),
      ]);
      // Newest first
      setSessions(history.reverse());
      setBadges(allBadges);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => modeFilter === 'all' ? sessions : sessions.filter((s) => s.config.mode === modeFilter),
    [sessions, modeFilter],
  );

  const heatmap = useMemo(() => buildHeatmap(sessions), [sessions]);

  const handleExportCSV = useCallback(() => exportCSV(filtered), [filtered]);

  if (loading) {
    return (
      <div className="history-screen">
        <p className="loading-text">Đang tải...</p>
      </div>
    );
  }

  const earnedBadges = Object.keys(badges).filter((k) => badges[k]);
  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.finalScore ?? 0), 0) / totalSessions)
      : 0;

  return (
    <div className="history-screen">
      <button className="btn btn-back" onClick={onBack} type="button">
        ← Quay lại
      </button>

      <h2 className="history-title">Lịch sử phiên</h2>

      {/* Summary Stats */}
      <div className="history-summary">
        <div className="summary-stat">
          <span className="summary-value">{totalSessions}</span>
          <span className="summary-label">Phiên</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">{avgScore}</span>
          <span className="summary-label">Điểm TB</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">{earnedBadges.length}</span>
          <span className="summary-label">Huy hiệu</span>
        </div>
      </div>

      {/* 7-day Heatmap */}
      <div className="heatmap-section">
        <span className="heatmap-label">7 ngày gần nhất</span>
        <div className="heatmap-grid">
          {heatmap.map((day) => (
            <div key={day.date} className="heatmap-cell-wrapper">
              <div
                className="heatmap-cell"
                style={{ background: heatmapColor(day.avgScore, day.count) }}
                title={`${day.date}: ${day.count} phiên, TB ${day.avgScore} điểm`}
              >
                {day.count > 0 ? day.count : ''}
              </div>
              <span className="heatmap-day">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Row */}
      {earnedBadges.length > 0 && (
        <div className="history-badges">
          {earnedBadges.map((id) => (
            <span key={id} className="badge-chip badge-chip--earned">
              {id.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Filter + Export */}
      <div className="history-toolbar">
        <select
          className="mode-filter"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value as SessionMode | 'all')}
        >
          <option value="all">Tất cả</option>
          {(Object.keys(MODE_LABELS) as SessionMode[]).map((m) => (
            <option key={m} value={m}>{MODE_LABELS[m]}</option>
          ))}
        </select>
        <button
          className="btn btn-export"
          onClick={handleExportCSV}
          type="button"
          disabled={filtered.length === 0}
        >
          📥 CSV
        </button>
      </div>

      {/* Session List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-text">
            {modeFilter === 'all'
              ? 'Chưa có phiên nào. Bắt đầu phiên đầu tiên!'
              : 'Không có phiên nào cho bộ lọc này.'}
          </p>
        </div>
      ) : (
        <div className="session-list">
          {filtered.map((s) => {
            const grade = getGrade(s.finalScore ?? 0);
            const dateStr = new Date(s.startTime).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            const duration = s.endTime
              ? Math.round((s.endTime - s.startTime) / 60000)
              : s.config.durationMinutes;

            return (
              <button
                key={s.id}
                className="session-card"
                onClick={() => onViewResult(s)}
                type="button"
              >
                <div className="session-card-left">
                  <span
                    className="session-grade-badge"
                    style={{ background: grade.color }}
                  >
                    {grade.grade}
                  </span>
                </div>
                <div className="session-card-center">
                  <span className="session-card-task">{s.config.taskName}</span>
                  <span className="session-card-meta">
                    {dateStr} · {duration} phút · {s.config.mode}
                  </span>
                </div>
                <div className="session-card-right">
                  <span className="session-card-score">{Math.round(s.finalScore ?? 0)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
