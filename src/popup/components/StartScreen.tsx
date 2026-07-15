/**
 * FocusProof – StartScreen Component
 * Màn hình khởi tạo phiên: task name, session mode, allowed domains,
 * toggle external apps, strict mode, duration, camera toggle.
 *
 * Reference: y_tuong.md Section 2.2 – Smart Task & Goal System
 */

import { useState, useEffect } from 'react';
import type { SessionConfig, SessionMode } from '@/utils/types';
import { DEFAULT_GOAL_DOMAIN_RULES } from '@/utils/types';
import { readConsent } from '@/utils/consent';

interface StartScreenProps {
  onStart: (config: SessionConfig) => void;
  onHistory: () => void;
  /** Lỗi khởi tạo phiên từ App (START_SESSION thất bại) — hiển thị banner */
  startError?: string | null;
  onDismissError?: () => void;
}

/** Key lưu cấu hình phiên gần nhất trong chrome.storage.local */
const LAST_CONFIG_KEY = 'fp_last_config';

/** Cấu hình được ghi nhớ giữa các phiên (không gồm taskName) */
interface LastConfig {
  mode: SessionMode;
  durationMinutes: number;
  cameraEnabled: boolean;
  strictMode: boolean;
  allowExternalApps: boolean;
  allowedDomains: string[];
}

/** Task presets theo y_tuong.md */
const MODE_PRESETS: Array<{
  mode: SessionMode;
  label: string;
  icon: string;
  description: string;
}> = [
  { mode: 'study', label: 'Học tập', icon: '📚', description: 'Google Docs, Notion, Evernote' },
  { mode: 'work', label: 'Làm việc', icon: '💼', description: 'Google Docs, Drive, Notion' },
  { mode: 'programming', label: 'Lập trình', icon: '💻', description: 'GitHub, GitLab, localhost, VSCode' },
  { mode: 'video-lecture', label: 'Xem bài giảng', icon: '🎥', description: 'YouTube, Coursera, Udemy, Zoom' },
];

const DURATION_OPTIONS = [3, 15, 25, 45, 60, 90, 120];

export default function StartScreen({ onStart, onHistory, startError, onDismissError }: StartScreenProps) {
  const [taskName, setTaskName] = useState('');
  const [mode, setMode] = useState<SessionMode>('study');
  const [customDomains, setCustomDomains] = useState('');
  const [allowExternalApps, setAllowExternalApps] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultDomains = DEFAULT_GOAL_DOMAIN_RULES[mode];

  // Khôi phục cấu hình phiên gần nhất (fp_last_config) khi mở màn hình
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await chrome.storage.local.get(LAST_CONFIG_KEY);
        const saved = res[LAST_CONFIG_KEY] as Partial<LastConfig> | undefined;
        if (!saved || cancelled) return;

        const validMode = MODE_PRESETS.some((p) => p.mode === saved.mode);
        if (validMode && saved.mode) setMode(saved.mode);
        if (typeof saved.durationMinutes === 'number' && DURATION_OPTIONS.includes(saved.durationMinutes)) {
          setDurationMinutes(saved.durationMinutes);
        }
        if (typeof saved.cameraEnabled === 'boolean') setCameraEnabled(saved.cameraEnabled);
        if (typeof saved.strictMode === 'boolean') setStrictMode(saved.strictMode);
        if (typeof saved.allowExternalApps === 'boolean') setAllowExternalApps(saved.allowExternalApps);

        // Suy ra domain bổ sung = allowedDomains đã lưu trừ đi domain mặc định của mode
        let hasCustom = false;
        if (validMode && saved.mode && Array.isArray(saved.allowedDomains)) {
          const defaults = DEFAULT_GOAL_DOMAIN_RULES[saved.mode];
          const custom = saved.allowedDomains.filter(
            (d) => typeof d === 'string' && !defaults.includes(d),
          );
          if (custom.length > 0) {
            setCustomDomains(custom.join(', '));
            hasCustom = true;
          }
        }

        // Có tùy chỉnh nâng cao → mở sẵn để user thấy
        if (hasCustom || saved.strictMode === true || saved.allowExternalApps === false) {
          setShowAdvanced(true);
        }
      } catch {
        // Storage lỗi → dùng giá trị mặc định
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleStart() {
    const parsedCustom = customDomains
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    // Đọc consent để gắn cờ opt-in thu 500 ký tự gõ cuối (CWS user-data policy)
    const consent = await readConsent();

    const config: SessionConfig = {
      taskName: taskName.trim() || `Phiên ${MODE_PRESETS.find((p) => p.mode === mode)?.label}`,
      mode,
      allowedDomains: [...defaultDomains, ...parsedCustom],
      allowExternalApps,
      strictMode,
      durationMinutes,
      cameraEnabled,
      captureTypedContent: consent?.captureTyped === true,
    };

    // Ghi nhớ cấu hình cho lần sau (không lưu taskName)
    const lastConfig: LastConfig = {
      mode,
      durationMinutes,
      cameraEnabled,
      strictMode,
      allowExternalApps,
      allowedDomains: config.allowedDomains,
    };
    try {
      await chrome.storage.local.set({ [LAST_CONFIG_KEY]: lastConfig });
    } catch {
      // Không chặn việc bắt đầu phiên nếu lưu cấu hình lỗi
    }

    onStart(config);
  }

  return (
    <div className="start-screen">
      {/* Banner lỗi khởi tạo phiên */}
      {startError && (
        <div className="error-banner" role="alert">
          <span className="error-banner-icon" aria-hidden="true">⚠️</span>
          <p className="error-banner-text">{startError}</p>
          {onDismissError && (
            <button
              className="error-banner-close"
              onClick={onDismissError}
              type="button"
              aria-label="Đóng thông báo lỗi"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <p className="screen-subtitle">Bắt đầu phiên tập trung</p>

      {/* Task Name */}
      <div className="form-group">
        <label className="form-label">Tên công việc</label>
        <input
          className="form-input"
          type="text"
          placeholder="Ví dụ: Ôn thi Toán, Code feature X..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Mode Selection */}
      <div className="form-group">
        <label className="form-label">Loại mục tiêu</label>
        <div className="mode-grid" role="radiogroup" aria-label="Chọn loại mục tiêu">
          {MODE_PRESETS.map((preset) => (
            <button
              key={preset.mode}
              className={`mode-card ${mode === preset.mode ? 'mode-card--active' : ''}`}
              onClick={() => setMode(preset.mode)}
              type="button"
              role="radio"
              aria-checked={mode === preset.mode}
            >
              <span className="mode-icon">{preset.icon}</span>
              <span className="mode-label">{preset.label}</span>
            </button>
          ))}
        </div>
        <p className="form-hint">
          Mặc định: {defaultDomains.join(', ')}
        </p>
      </div>

      {/* Duration */}
      <div className="form-group">
        <label className="form-label">Thời lượng</label>
        <div className="duration-grid" role="radiogroup" aria-label="Chọn thời lượng">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              className={`duration-chip ${durationMinutes === d ? 'duration-chip--active' : ''}`}
              onClick={() => setDurationMinutes(d)}
              type="button"
              role="radio"
              aria-checked={durationMinutes === d}
              title={d === 3 ? 'Test nhanh – kiểm tra camera & tập trung' : undefined}
            >
              {d} phút
            </button>
          ))}
        </div>
      </div>

      {/* Camera Toggle */}
      <div className="form-group form-row">
        <label className="form-label">Bật camera (Face Detection)</label>
        <button
          className={`toggle ${cameraEnabled ? 'toggle--on' : ''}`}
          onClick={() => setCameraEnabled(!cameraEnabled)}
          type="button"
          aria-label="Toggle camera"
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {!cameraEnabled && (
        <p className="form-hint form-hint--warning">
          Camera tắt: chỉ dùng Activity (60%) + Tab (40%)
        </p>
      )}

      {/* Advanced Settings */}
      <button
        className="btn-link"
        onClick={() => setShowAdvanced(!showAdvanced)}
        type="button"
      >
        {showAdvanced ? '▲ Ẩn cài đặt nâng cao' : '▼ Cài đặt nâng cao'}
      </button>

      {showAdvanced && (
        <div className="advanced-settings">
          {/* Custom Domains */}
          <div className="form-group">
            <label className="form-label">Domain bổ sung (phân cách bằng dấu phẩy)</label>
            <input
              className="form-input"
              type="text"
              placeholder="myapp.com, internal.corp.net"
              value={customDomains}
              onChange={(e) => setCustomDomains(e.target.value)}
            />
          </div>

          {/* Allow External Apps */}
          <div className="form-group form-row">
            <label className="form-label">Cho phép ứng dụng ngoài Chrome</label>
            <button
              className={`toggle ${allowExternalApps ? 'toggle--on' : ''}`}
              onClick={() => setAllowExternalApps(!allowExternalApps)}
              type="button"
              aria-label="Toggle external apps"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Strict Mode */}
          <div className="form-group form-row">
            <label className="form-label">Strict Mode (chỉ 1 tab)</label>
            <button
              className={`toggle ${strictMode ? 'toggle--on' : ''}`}
              onClick={() => setStrictMode(!strictMode)}
              type="button"
              aria-label="Toggle strict mode"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          {strictMode && (
            <p className="form-hint form-hint--warning">
              Chỉ cho phép tab hiện tại khi bắt đầu phiên
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="actions-row">
        <button className="btn btn-primary btn-full" onClick={handleStart} type="button">
          🎯 Bắt đầu
        </button>
        <button className="btn btn-secondary btn-full" onClick={onHistory} type="button">
          📊 Lịch sử
        </button>
      </div>
    </div>
  );
}
