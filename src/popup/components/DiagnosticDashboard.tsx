/**
 * FocusProof – DiagnosticDashboard Component
 * Trang chẩn đoán: kiểm tra camera, quyền truy cập, hiệu năng extension,
 * và test goal-based alert theo mode/domain.
 *
 * Reference: y_tuong.md Section 2.2 – Diagnostic Dashboard
 */

import { useState, useCallback } from 'react';
import type { SessionMode, GoalConfig } from '@/utils/types';
import { DEFAULT_GOAL_DOMAIN_RULES } from '@/utils/types';
import { isGoalCompliant } from '@/utils/goal-evaluator';
import { storage } from '@/utils/storage';

interface DiagnosticDashboardProps {
  onBack: () => void;
}

type CheckStatus = 'idle' | 'loading' | 'pass' | 'fail' | 'warn';

const STATUS_LABELS: Record<CheckStatus, string> = {
  idle: 'Chưa kiểm tra',
  loading: 'Đang kiểm tra…',
  pass: '✓ Đạt',
  fail: '✗ Lỗi',
  warn: '⚠ Cảnh báo',
};

export default function DiagnosticDashboard({ onBack }: DiagnosticDashboardProps) {
  /* ── Camera state ── */
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>('idle');
  const [cameraDetail, setCameraDetail] = useState('');

  /* ── Permissions state ── */
  const [permTabsStatus, setPermTabsStatus] = useState<CheckStatus>('idle');
  const [permStorageStatus, setPermStorageStatus] = useState<CheckStatus>('idle');
  const [permNotifStatus, setPermNotifStatus] = useState<CheckStatus>('idle');
  const [permOffscreenStatus, setPermOffscreenStatus] = useState<CheckStatus>('idle');

  /* ── Performance state ── */
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);
  const [storageBytesUsed, setStorageBytesUsed] = useState<number | null>(null);
  const [perfLoaded, setPerfLoaded] = useState(false);

  /* ── Goal test state ── */
  const [goalMode, setGoalMode] = useState<SessionMode>('study');
  const [goalDomain, setGoalDomain] = useState('');
  const [goalResult, setGoalResult] = useState<boolean | null>(null);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 1. Camera Check
   * Yêu cầu quyền camera, giải phóng ngay sau khi test.
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const testCamera = useCallback(async () => {
    setCameraStatus('loading');
    setCameraDetail('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Đếm số camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');
      // Dừng tất cả tracks ngay lập tức
      stream.getTracks().forEach((t) => t.stop());

      setCameraStatus('pass');
      setCameraDetail(`${cameras.length} camera được phát hiện`);
    } catch (err: unknown) {
      setCameraStatus('fail');
      const msg = err instanceof Error ? err.message : 'Không truy cập được camera';
      setCameraDetail(msg);
    }
  }, []);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 2. Permissions Check
   * Kiểm tra từng permission qua chrome.permissions.contains
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const testPermissions = useCallback(() => {
    const checks: Array<{
      perm: string;
      setter: React.Dispatch<React.SetStateAction<CheckStatus>>;
    }> = [
      { perm: 'tabs', setter: setPermTabsStatus },
      { perm: 'storage', setter: setPermStorageStatus },
      { perm: 'notifications', setter: setPermNotifStatus },
      { perm: 'offscreen', setter: setPermOffscreenStatus },
    ];

    for (const { perm, setter } of checks) {
      setter('loading');
      chrome.permissions.contains({ permissions: [perm] }, (granted) => {
        setter(granted ? 'pass' : 'fail');
      });
    }
  }, []);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 3. Extension Performance
   * Đọc storage usage, session count, badge count.
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const testPerformance = useCallback(async () => {
    setPerfLoaded(false);

    // Storage bytes
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      setStorageBytesUsed(bytes);
    });

    // Session history count
    const history = await storage.getSessionHistory();
    setSessionCount(history.length);

    // Badge count
    const badges = await storage.getBadges();
    setBadgeCount(Object.values(badges).filter(Boolean).length);

    setPerfLoaded(true);
  }, []);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 4. Goal Alert Test
   * Test isGoalCompliant() realtime với mode + domain input.
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const testGoal = useCallback(() => {
    const domain = goalDomain.trim().toLowerCase();
    if (!domain) {
      setGoalResult(null);
      return;
    }

    const config: GoalConfig = {
      mode: goalMode,
      customAllowedDomains: [],
      customExternalRule: null,
    };

    const result = isGoalCompliant(domain, config);
    setGoalResult(result);
  }, [goalMode, goalDomain]);

  /* ── Format helpers ── */
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="diagnostic-screen">
      <button className="btn btn-back" onClick={onBack} type="button">
        ← Quay lại
      </button>

      <h2 className="diagnostic-title">🔧 Diagnostic Dashboard</h2>
      <p className="diagnostic-desc">
        Kiểm tra camera, quyền truy cập, hiệu năng extension và test goal-based alert.
      </p>

      {/* ── Open full diagnostic page in tab ── */}
      <div className="diag-panel" style={{ background: 'var(--bg-secondary)', marginBottom: 12 }}>
        <div className="diag-panel-body">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            ⚠️ Camera test trong popup có thể bị lỗi vì Chrome đóng popup khi hiện permission dialog. Mở trang diagnostic đầy đủ:
          </p>
          <button
            className="btn btn-primary btn-full"
            type="button"
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL('camera-diagnostic.html') });
            }}
          >
            🔬 Mở Camera Diagnostic (Full Page)
          </button>
          <button
            className="btn btn-primary btn-full"
            type="button"
            style={{ marginTop: 6, background: 'var(--warning)' }}
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL('alert-diagnostic.html') });
            }}
          >
            🔔 Mở Alert & Goal Diagnostic (Full Page)
          </button>
          <button
            className="btn btn-primary btn-full"
            type="button"
            style={{ marginTop: 6, background: '#8b5cf6' }}
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL('widget-diagnostic.html') });
            }}
          >
            🧩 Mở Widget Diagnostic (Full Page)
          </button>
        </div>
      </div>

      {/* ── Panel 1: Camera ── */}
      <div className="diag-panel">
        <div className="diag-panel-header">
          <span className="diag-panel-icon">📷</span>
          Camera Check
        </div>
        <div className="diag-panel-body">
          <div className="diag-check">
            <span className="diag-check-label">Quyền camera</span>
            <span className={`diag-status diag-status--${cameraStatus}`}>
              {STATUS_LABELS[cameraStatus]}
            </span>
          </div>
          {cameraDetail && (
            <p className="form-hint">{cameraDetail}</p>
          )}
          <button className="diag-btn" onClick={testCamera} disabled={cameraStatus === 'loading'} type="button">
            Kiểm tra camera
          </button>
        </div>
      </div>

      {/* ── Panel 2: Permissions ── */}
      <div className="diag-panel">
        <div className="diag-panel-header">
          <span className="diag-panel-icon">🔑</span>
          Quyền truy cập
        </div>
        <div className="diag-panel-body">
          <div className="diag-check">
            <span className="diag-check-label">tabs</span>
            <span className={`diag-status diag-status--${permTabsStatus}`}>
              {STATUS_LABELS[permTabsStatus]}
            </span>
          </div>
          <div className="diag-check">
            <span className="diag-check-label">storage</span>
            <span className={`diag-status diag-status--${permStorageStatus}`}>
              {STATUS_LABELS[permStorageStatus]}
            </span>
          </div>
          <div className="diag-check">
            <span className="diag-check-label">notifications</span>
            <span className={`diag-status diag-status--${permNotifStatus}`}>
              {STATUS_LABELS[permNotifStatus]}
            </span>
          </div>
          <div className="diag-check">
            <span className="diag-check-label">offscreen</span>
            <span className={`diag-status diag-status--${permOffscreenStatus}`}>
              {STATUS_LABELS[permOffscreenStatus]}
            </span>
          </div>
          <button className="diag-btn" onClick={testPermissions} type="button">
            Kiểm tra quyền
          </button>
        </div>
      </div>

      {/* ── Panel 3: Performance ── */}
      <div className="diag-panel">
        <div className="diag-panel-header">
          <span className="diag-panel-icon">⚡</span>
          Hiệu năng Extension
        </div>
        <div className="diag-panel-body">
          {perfLoaded ? (
            <>
              <div className="diag-info">
                <span className="diag-info-label">Storage sử dụng</span>
                <span className="diag-info-value">
                  {storageBytesUsed !== null ? formatBytes(storageBytesUsed) : '—'}
                </span>
              </div>
              <div className="diag-info">
                <span className="diag-info-label">Số phiên đã lưu</span>
                <span className="diag-info-value">{sessionCount ?? '—'}</span>
              </div>
              <div className="diag-info">
                <span className="diag-info-label">Huy hiệu đã đạt</span>
                <span className="diag-info-value">{badgeCount ?? '—'}</span>
              </div>
              <div className="diag-info">
                <span className="diag-info-label">Extension version</span>
                <span className="diag-info-value">
                  {chrome.runtime.getManifest().version}
                </span>
              </div>
            </>
          ) : (
            <p className="form-hint">Nhấn nút bên dưới để tải thông tin.</p>
          )}
          <button className="diag-btn" onClick={testPerformance} type="button">
            Tải thông tin
          </button>
        </div>
      </div>

      {/* ── Panel 4: Goal Alert Test ── */}
      <div className="diag-panel">
        <div className="diag-panel-header">
          <span className="diag-panel-icon">🎯</span>
          Test Goal-based Alert
        </div>
        <div className="diag-panel-body">
          <div className="diag-goal-form">
            <div className="diag-goal-row">
              <select
                className="diag-goal-select"
                value={goalMode}
                onChange={(e) => {
                  setGoalMode(e.target.value as SessionMode);
                  setGoalResult(null);
                }}
              >
                <option value="study">📚 Học tập</option>
                <option value="work">💼 Làm việc</option>
                <option value="programming">💻 Lập trình</option>
                <option value="video-lecture">🎥 Xem bài giảng</option>
              </select>
              <input
                className="diag-goal-input"
                type="text"
                placeholder="Nhập domain, vd: youtube.com"
                value={goalDomain}
                onChange={(e) => {
                  setGoalDomain(e.target.value);
                  setGoalResult(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && testGoal()}
              />
            </div>

            <p className="form-hint">
              Defaults: {DEFAULT_GOAL_DOMAIN_RULES[goalMode].join(', ')}
            </p>

            <button className="diag-btn" onClick={testGoal} type="button">
              Test isGoalCompliant()
            </button>

            {goalResult !== null && (
              <div className={`diag-goal-result diag-goal-result--${goalResult ? 'pass' : 'fail'}`}>
                {goalResult ? '✓ COMPLIANT' : '✗ NOT COMPLIANT'} — "{goalDomain}" trong mode "{goalMode}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
