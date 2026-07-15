/**
 * FocusProof – DiagnosticDashboard Component
 * Trang chẩn đoán: kiểm tra camera, quyền truy cập, hiệu năng extension,
 * và test goal-based alert theo mode/domain.
 *
 * Reference: y_tuong.md Section 2.2 – Diagnostic Dashboard
 */

import { useState, useCallback, useRef } from 'react';
import type { SessionMode, GoalConfig } from '@/utils/types';
import { DEFAULT_GOAL_DOMAIN_RULES } from '@/utils/types';
import { isGoalCompliant } from '@/utils/goal-evaluator';
import { storage, exportAllData, importAllData } from '@/utils/storage';
import {
  getSummary,
  clearAnalytics,
  getRecentErrors,
  type AnalyticsSummary,
  type RuntimeErrorEntry,
} from '@/utils/analytics';

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

  /* ── Analytics & error-log state ── */
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentErrors, setRecentErrors] = useState<RuntimeErrorEntry[]>([]);
  const loadAnalytics = useCallback(async () => {
    setAnalytics(await getSummary());
    setRecentErrors(await getRecentErrors(10));
  }, []);
  const resetAnalytics = useCallback(async () => {
    await clearAnalytics();
    setAnalytics(await getSummary());
    setRecentErrors([]);
  }, []);

  /* ── Data management state (backup/restore) ── */
  const [dataMessage, setDataMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dataBusy, setDataBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Tải chuỗi JSON về máy dưới dạng file .json */
  const downloadJson = useCallback((json: string, filename: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  /** Xuất toàn bộ dữ liệu → focusproof-backup-YYYY-MM-DD.json */
  const handleExportData = useCallback(async () => {
    setDataBusy(true);
    setDataMessage(null);
    try {
      const json = await exportAllData();
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(json, `focusproof-backup-${date}.json`);
      setDataMessage({ ok: true, text: 'Đã xuất file sao lưu.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Xuất dữ liệu thất bại.';
      setDataMessage({ ok: false, text: msg });
    } finally {
      setDataBusy(false);
    }
  }, [downloadJson]);

  /** Nhập dữ liệu từ file JSON đã chọn (merge, không nhân đôi). */
  const handleImportFile = useCallback(async (file: File) => {
    const confirmed = window.confirm(
      `Nhập dữ liệu từ "${file.name}"?\nDữ liệu sẽ được GỘP với dữ liệu hiện có (phiên trùng không nhân đôi).`,
    );
    if (!confirmed) return;

    setDataBusy(true);
    setDataMessage(null);
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Không đọc được file.'));
        reader.readAsText(file);
      });
      const result = await importAllData(text);
      const skippedNote = result.skipped > 0 ? ` (bỏ qua ${result.skipped} phiên hỏng)` : '';
      setDataMessage({
        ok: true,
        text: `Đã nhập ${result.imported.sessions} phiên mới, ${result.imported.badges} huy hiệu mới${skippedNote}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nhập dữ liệu thất bại.';
      setDataMessage({ ok: false, text: msg });
    } finally {
      setDataBusy(false);
    }
  }, []);

  /** Xuất 10 lỗi runtime gần nhất thành file JSON. */
  const handleExportErrorLog = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(
      JSON.stringify({ exportedAt: new Date().toISOString(), errors: recentErrors }, null, 2),
      `focusproof-errorlog-${date}.json`,
    );
  }, [downloadJson, recentErrors]);

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
            ⚠️ Camera test trong popup có thể bị lỗi vì Chrome đóng popup khi hiện permission dialog. Mở trang cài đặt camera:
          </p>
          <button
            className="btn btn-primary btn-full"
            type="button"
            onClick={() => {
              chrome.tabs.create({ url: chrome.runtime.getURL('camera-diagnostic.html') });
            }}
          >
            📷 Cài đặt & Kiểm tra Camera
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

      {/* ── Panel 5: Analytics & Error Log (theo dõi sản phẩm) ── */}
      <div className="diag-panel">
        <div className="diag-panel-header">
          <span className="diag-panel-icon">📈</span>
          Analytics & Error Log
        </div>
        <div className="diag-panel-body">
          {analytics ? (
            <>
              <div className="diag-info">
                <span className="diag-info-label">Tổng sự kiện</span>
                <span className="diag-info-value">{analytics.total}</span>
              </div>
              <div className="diag-info">
                <span className="diag-info-label">Lỗi runtime</span>
                <span
                  className="diag-info-value"
                  style={analytics.errorCount > 0 ? { color: '#EF4444' } : undefined}
                >
                  {analytics.errorCount}
                </span>
              </div>
              {Object.entries(analytics.counts)
                .filter(([name]) => name !== 'runtime_error')
                .map(([name, count]) => (
                  <div className="diag-info" key={name}>
                    <span className="diag-info-label">{name}</span>
                    <span className="diag-info-value">{count}</span>
                  </div>
                ))}
            </>
          ) : (
            <p className="form-hint">
              Đếm sự kiện sử dụng (phiên, AI, PDF…) và lỗi runtime — lưu 100% cục bộ.
            </p>
          )}

          {/* ── 10 lỗi runtime gần nhất ── */}
          {analytics && (
            recentErrors.length > 0 ? (
              <div className="diag-error-list">
                <p className="diag-error-list-title">Lỗi gần nhất ({recentErrors.length})</p>
                {recentErrors.map((e, i) => (
                  <div className="diag-error-item" key={`${e.ts}-${i}`}>
                    <div className="diag-error-head">
                      <span className="diag-error-time">
                        {new Date(e.ts).toLocaleString('vi-VN')}
                      </span>
                      <span className="diag-error-context">{e.context}</span>
                    </div>
                    <p className="diag-error-message">{e.message}</p>
                    {e.stack && (
                      <details className="diag-error-stack">
                        <summary>Xem stack</summary>
                        <pre>{e.stack}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="form-hint">Chưa ghi nhận lỗi runtime nào. 🎉</p>
            )
          )}

          <div className="diag-goal-row" style={{ gap: 8 }}>
            <button className="diag-btn" onClick={loadAnalytics} type="button">
              Tải số liệu
            </button>
            <button
              className="diag-btn"
              onClick={handleExportErrorLog}
              disabled={recentErrors.length === 0}
              type="button"
            >
              Xuất log lỗi (JSON)
            </button>
            <button className="diag-btn" onClick={resetAnalytics} type="button">
              Xóa log
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel 6: Quản lý dữ liệu (sao lưu / phục hồi) ── */}
      <div className="diag-panel">
        <div className="diag-panel-header">
          <span className="diag-panel-icon">💾</span>
          Quản lý dữ liệu
        </div>
        <div className="diag-panel-body">
          <p className="form-hint">
            Sao lưu lịch sử phiên + huy hiệu ra file JSON, hoặc phục hồi từ file đã xuất.
            Nhập dữ liệu sẽ GỘP với dữ liệu hiện có, không nhân đôi phiên.
          </p>
          <div className="diag-goal-row" style={{ gap: 8 }}>
            <button
              className="diag-btn"
              onClick={handleExportData}
              disabled={dataBusy}
              type="button"
            >
              Xuất dữ liệu (JSON)
            </button>
            <button
              className="diag-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={dataBusy}
              type="button"
            >
              Nhập dữ liệu
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = ''; // cho phép chọn lại cùng file
              }}
            />
          </div>
          {dataMessage && (
            <div className={`diag-goal-result diag-goal-result--${dataMessage.ok ? 'pass' : 'fail'}`}>
              {dataMessage.ok ? '✓' : '✗'} {dataMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
