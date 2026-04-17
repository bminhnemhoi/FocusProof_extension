/**
 * FocusProof – RunningScreen Component
 * Hiển thị trạng thái phiên đang chạy: timer, focus score, alert count.
 * Poll SESSION_STATUS mỗi 2 giây.
 *
 * Reference: y_tuong.md Section 2.2 – Floating Widget cũng hiển thị cùng thông tin
 */

import { useState, useEffect, useRef } from 'react';
import type { SessionData } from '@/utils/types';

interface RunningScreenProps {
  onStop: (session: SessionData) => void;
}

interface SessionStatusResponse {
  status: string;
  session: SessionData | null;
  alertCount: number;
}

export default function RunningScreen({ onStop }: RunningScreenProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const elapsedRef = useRef(0);
  const [, setTick] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Poll session status
    function poll() {
      chrome.runtime.sendMessage(
        { type: 'SESSION_STATUS', payload: null },
        (response: SessionStatusResponse) => {
          if (response?.session) {
            setSession(response.session);
            setAlertCount(response.alertCount ?? 0);
          }
        },
      );
    }

    poll();
    pollRef.current = setInterval(poll, 2000);

    // Local elapsed timer (triggers re-render every second for countdown)
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleStop() {
    setStopping(true);
    setStopError('');
    chrome.runtime.sendMessage(
      { type: 'STOP_SESSION', payload: null },
      (response: { success?: boolean; error?: string; session?: SessionData }) => {
        if (chrome.runtime.lastError) {
          setStopError('Mất kết nối. Thử lại...');
          setStopping(false);
          return;
        }
        if (response?.success && response.session) {
          onStop(response.session);
        } else if (response?.error) {
          // Session may have already stopped (auto-timeout) — check for last result
          chrome.runtime.sendMessage(
            { type: 'SESSION_STATUS', payload: null },
            (status: { lastResult?: SessionData; status?: string }) => {
              if (status?.lastResult) {
                onStop(status.lastResult);
                chrome.runtime.sendMessage({ type: 'CLEAR_LAST_RESULT', payload: null });
              } else {
                setStopError(response.error!);
                setStopping(false);
              }
            },
          );
        } else {
          // Response missing session — check if already finished
          chrome.runtime.sendMessage(
            { type: 'SESSION_STATUS', payload: null },
            (status: { lastResult?: SessionData; status?: string }) => {
              if (status?.lastResult) {
                onStop(status.lastResult);
                chrome.runtime.sendMessage({ type: 'CLEAR_LAST_RESULT', payload: null });
              } else {
                setStopError('Phiên đã kết thúc.');
                setStopping(false);
              }
            },
          );
        }
      },
    );
  }

  if (!session) {
    return (
      <div className="running-screen">
        <p className="loading-text">Đang tải...</p>
      </div>
    );
  }

  const totalSeconds = session.config.durationMinutes * 60;
  const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  // Live focus score from latest samples
  const latestSamples = session.samples.slice(-5);
  const avgScore =
    latestSamples.length > 0
      ? Math.round(
          (latestSamples.reduce((sum, s) => sum + s.focusScore, 0) / latestSamples.length) * 100,
        )
      : 0;

  const sampleCount = session.samples.length;

  return (
    <div className="running-screen">
      {/* Timer */}
      <div className="timer-section" aria-live="polite" aria-atomic="true">
        <div className="timer-ring" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}>
          <span className="timer-value">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <p className="timer-label">còn lại</p>
      </div>

      {/* Task Info */}
      <div className="session-info">
        <p className="session-task">{session.config.taskName}</p>
        <div className="session-badges-row">
          <span className="info-badge">{session.config.mode}</span>
          {session.config.cameraEnabled && <span className="info-badge info-badge--camera">📷 Camera ON</span>}
          {session.config.strictMode && <span className="info-badge info-badge--strict">🔒 Strict</span>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{avgScore}%</span>
          <span className="stat-label">Focus</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{sampleCount}</span>
          <span className="stat-label">Samples</span>
        </div>
        <div className="stat-card">
          <span className={`stat-value ${alertCount > 0 ? 'stat-value--warning' : ''}`}>
            {alertCount}
          </span>
          <span className="stat-label">Alerts</span>
        </div>
      </div>

      {/* Stop Button */}
      <button
        className="btn btn-danger btn-full"
        onClick={handleStop}
        disabled={stopping}
        type="button"
      >
        {stopping ? '🔄 Đang dừng...' : '⏹ Dừng phiên'}
      </button>
      {stopError && <p className="form-hint form-hint--warning">{stopError}</p>}
    </div>
  );
}
