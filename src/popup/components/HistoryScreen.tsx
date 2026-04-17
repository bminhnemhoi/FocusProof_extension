/**
 * FocusProof – HistoryScreen Component
 * Hiển thị lịch sử phiên tập trung, badges tổng hợp.
 *
 * Reference: y_tuong.md Section 2.3 – Lịch sử & Báo cáo
 */

import { useState, useEffect } from 'react';
import type { SessionData } from '@/utils/types';
import { getGrade } from '@/utils/focus';
import { storage } from '@/utils/storage';

interface HistoryScreenProps {
  onBack: () => void;
  onViewResult: (session: SessionData) => void;
}

export default function HistoryScreen({ onBack, onViewResult }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [badges, setBadges] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

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

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-text">Chưa có phiên nào. Bắt đầu phiên đầu tiên!</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((s) => {
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
