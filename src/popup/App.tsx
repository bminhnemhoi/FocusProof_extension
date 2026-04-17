/**
 * FocusProof – Popup App (Orchestrator)
 * Điều phối navigation giữa các screens: Start → CameraModal → Running → Result → History.
 *
 * Reference: y_tuong.md Section 6 – User Flow
 */

import { useState, useEffect, useCallback } from 'react';
import type { SessionConfig, SessionData, SessionStatus } from '@/utils/types';
import StartScreen from './components/StartScreen';
import CameraModal from './components/CameraModal';
import RunningScreen from './components/RunningScreen';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import DiagnosticDashboard from './components/DiagnosticDashboard';

type Screen = 'start' | 'camera-modal' | 'running' | 'result' | 'history' | 'diagnostic';
type Theme = 'light' | 'dark' | 'system';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [pendingConfig, setPendingConfig] = useState<SessionConfig | null>(null);
  const [lastResult, setLastResult] = useState<SessionData | null>(null);
  const [theme, setTheme] = useState<Theme>('system');
  const [starting, setStarting] = useState(false);

  // Apply theme to document root
  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }, []);

  // Check for running session or recent result on popup open
  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'SESSION_STATUS', payload: null },
      (response: { status?: SessionStatus; lastResult?: SessionData }) => {
        if (response?.status === 'running') {
          setScreen('running');
        } else if (response?.lastResult) {
          // Session finished while popup was closed — show result
          setLastResult(response.lastResult);
          setScreen('result');
          // Clear so next open doesn't show stale result
          chrome.runtime.sendMessage({ type: 'CLEAR_LAST_RESULT', payload: null });
        }
      },
    );
  }, []);

  /** User clicked "Bắt đầu" in StartScreen */
  function handleStartRequest(config: SessionConfig) {
    setPendingConfig(config);
    if (config.cameraEnabled) {
      setScreen('camera-modal');
    } else {
      doStartSession(config);
    }
  }

  /** Camera modal confirmed — start with camera */
  function handleCameraConfirm() {
    if (pendingConfig) {
      doStartSession(pendingConfig);
    }
  }

  /** Camera modal skipped — start without camera */
  function handleCameraSkip() {
    if (pendingConfig) {
      doStartSession({ ...pendingConfig, cameraEnabled: false });
    }
  }

  /** Send START_SESSION to background */
  function doStartSession(config: SessionConfig) {
    setStarting(true);
    chrome.runtime.sendMessage(
      { type: 'START_SESSION', payload: config },
      (response: { success?: boolean; error?: string }) => {
        setStarting(false);
        if (response?.success) {
          setScreen('running');
        } else {
          // Fallback: check if session actually started
          chrome.runtime.sendMessage(
            { type: 'SESSION_STATUS', payload: null },
            (status: { status?: string }) => {
              if (status?.status === 'running') {
                setScreen('running');
              } else {
                setScreen('start');
              }
            },
          );
        }
      },
    );
  }

  /** Session stopped — show result */
  function handleSessionStopped(session: SessionData) {
    setLastResult(session);
    setScreen('result');
  }

  /** View a historical session result */
  function handleViewResult(session: SessionData) {
    setLastResult(session);
    setScreen('result');
  }

  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <div className="app-header-left">
          <h1 className="app-title">FocusProof</h1>
          <span className="app-version">v1.0.0</span>
        </div>
        <div className="app-header-actions">
          <button
            className="header-icon-btn"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            aria-label={`Đổi giao diện (hiện tại: ${theme})`}
            type="button"
          >
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
          </button>
          <button
            className="header-icon-btn"
            onClick={() => setScreen('diagnostic')}
            title="Diagnostic Dashboard"
            aria-label="Mở Diagnostic Dashboard"
            type="button"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="app-main" role="main" aria-live="polite">
        {screen === 'start' && (
          <StartScreen
            onStart={handleStartRequest}
            onHistory={() => setScreen('history')}
          />
        )}

        {screen === 'camera-modal' && !starting && (
          <CameraModal
            onConfirm={handleCameraConfirm}
            onSkip={handleCameraSkip}
          />
        )}

        {starting && (
          <div className="starting-overlay">
            <div className="starting-spinner">🔄</div>
            <p className="starting-text">Đang khởi tạo phiên...</p>
            <p className="starting-hint">Nếu có yêu cầu camera, hãy nhấn "Cho phép" trên thanh thông báo của Chrome</p>
          </div>
        )}

        {screen === 'running' && (
          <RunningScreen onStop={handleSessionStopped} />
        )}

        {screen === 'result' && lastResult && (
          <ResultScreen
            session={lastResult}
            onNewSession={() => setScreen('start')}
            onHistory={() => setScreen('history')}
          />
        )}

        {screen === 'history' && (
          <HistoryScreen
            onBack={() => setScreen('start')}
            onViewResult={handleViewResult}
          />
        )}

        {screen === 'diagnostic' && (
          <DiagnosticDashboard onBack={() => setScreen('start')} />
        )}
      </main>
    </div>
  );
}
