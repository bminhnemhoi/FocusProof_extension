/**
 * FocusProof – Floating Widget
 * Overlay realtime hiển thị trên mọi trang web.
 * Inject vào Shadow DOM để tránh xung đột CSS.
 *
 * Features:
 * - Hiển thị % tập trung (gradient ring), thời gian còn lại
 * - 4 indicator: Face, Activity, Tab, Alert
 * - Thu nhỏ thành vòng tròn 48px khi minimize
 * - Draggable
 * - Alert toast animation
 *
 * Reference: y_tuong.md Section 2.2 – Floating Widget
 */

import type { AlertEvent } from '@/utils/types';

// ============================================================
// Widget State
// ============================================================

let shadowRoot: ShadowRoot | null = null;
let hostElement: HTMLElement | null = null;
let isMinimized = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// ============================================================
// Styles (injected into Shadow DOM)
// ============================================================

const WIDGET_STYLES = `
:host {
  all: initial;
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  z-index: 2147483647 !important;
  font-family: 'Segoe UI', -apple-system, sans-serif !important;
}

.fp-widget {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 14px 16px;
  color: #f1f5f9;
  font-size: 13px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(99, 102, 241, 0.3);
  cursor: grab;
  user-select: none;
  transition: all 0.3s ease;
}

.fp-widget.fp-dragging {
  cursor: grabbing;
  opacity: 0.9;
}

.fp-widget.fp-minimized {
  width: 48px;
  height: 48px;
  min-width: unset;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fp-widget.fp-alert-flash {
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  animation: fp-pulse 0.6s ease-in-out 3;
}

@keyframes fp-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* Header */
.fp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.fp-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #a5b4fc;
  text-transform: uppercase;
}

.fp-minimize-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
}

.fp-minimize-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.1);
}

/* Score Row */
.fp-score-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.fp-score-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.fp-timer {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.fp-timer-label {
  font-size: 10px;
  color: #94a3b8;
}

/* Indicators */
.fp-indicators {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.fp-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  border-radius: 6px;
  font-size: 10px;
  color: #94a3b8;
}

.fp-indicator-icon {
  font-size: 14px;
}

.fp-indicator--ok .fp-indicator-icon { color: #22c55e; }
.fp-indicator--warn .fp-indicator-icon { color: #ef4444; }
.fp-indicator--off .fp-indicator-icon { color: #475569; }

/* Minimized state */
.fp-mini-score {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

/* Toast */
.fp-toast {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  animation: fp-toast-in 0.3s ease, fp-toast-out 0.3s ease 3s forwards;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

@keyframes fp-toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes fp-toast-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;

// ============================================================
// Create / Destroy
// ============================================================

export function createWidget(): void {
  if (hostElement) return;

  try {
    hostElement = document.createElement('focusproof-widget');
    shadowRoot = hostElement.attachShadow({ mode: 'closed' });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = WIDGET_STYLES;
    shadowRoot.appendChild(style);

    // Container
    const container = document.createElement('div');
    container.className = 'fp-widget';
    container.id = 'fp-container';
    container.innerHTML = buildExpandedHTML(0, '25:00', false, false, true);

    // Drag handlers
    container.addEventListener('mousedown', onDragStart);

    shadowRoot.appendChild(container);
    document.body.appendChild(hostElement);
  } catch (err) {
    console.error('[FocusProof] Widget creation failed:', err);
    // Cleanup partial state
    hostElement?.remove();
    hostElement = null;
    shadowRoot = null;
  }
}

export function destroyWidget(): void {
  if (hostElement) {
    hostElement.remove();
    hostElement = null;
    shadowRoot = null;
    isMinimized = false;
  }
}

// ============================================================
// Update
// ============================================================

export interface WidgetUpdatePayload {
  focusScore: number;
  timeRemaining: number;
  faceDetected: boolean;
  isIdle: boolean;
  goalCompliant: boolean;
}

export function updateWidget(data: WidgetUpdatePayload): void {
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('fp-container');
  if (!container) return;

  const scorePercent = Math.round(data.focusScore * 100);
  const minutes = Math.floor(data.timeRemaining / 60000);
  const seconds = Math.floor((data.timeRemaining % 60000) / 1000);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isMinimized) {
    container.innerHTML = `<span class="fp-mini-score">${scorePercent}</span>`;
    container.onclick = () => {
      isMinimized = false;
      container.classList.remove('fp-minimized');
      container.onclick = null;
      updateWidget(data);
    };
  } else {
    container.innerHTML = buildExpandedHTML(
      scorePercent,
      timeStr,
      data.faceDetected,
      data.isIdle,
      data.goalCompliant,
    );
    // Re-bind minimize button
    const minBtn = shadowRoot.getElementById('fp-minimize');
    if (minBtn) {
      minBtn.onclick = (e) => {
        e.stopPropagation();
        isMinimized = true;
        container.classList.add('fp-minimized');
        container.innerHTML = `<span class="fp-mini-score">${scorePercent}</span>`;
        container.onclick = () => {
          isMinimized = false;
          container.classList.remove('fp-minimized');
          container.onclick = null;
          updateWidget(data);
        };
      };
    }
  }
}

// ============================================================
// Alert Toast
// ============================================================

export function showAlert(alert: AlertEvent): void {
  if (!shadowRoot) return;

  const container = shadowRoot.getElementById('fp-container');
  if (!container) return;

  // Flash border
  container.classList.add('fp-alert-flash');
  setTimeout(() => container.classList.remove('fp-alert-flash'), 2000);

  // Toast
  const existing = shadowRoot.querySelector('.fp-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'fp-toast';
  toast.textContent = alert.message;
  container.style.position = 'relative';
  container.appendChild(toast);

  // Auto-remove after animation
  setTimeout(() => toast.remove(), 3500);
}

// ============================================================
// HTML Builders
// ============================================================

function getScoreGradient(score: number): string {
  if (score >= 80) return 'linear-gradient(135deg, #22c55e, #16a34a)';
  if (score >= 60) return 'linear-gradient(135deg, #3b82f6, #2563eb)';
  if (score >= 40) return 'linear-gradient(135deg, #f59e0b, #d97706)';
  return 'linear-gradient(135deg, #ef4444, #dc2626)';
}

function buildExpandedHTML(
  score: number,
  timeStr: string,
  faceDetected: boolean,
  isIdle: boolean,
  goalCompliant: boolean,
): string {
  const gradient = getScoreGradient(score);

  return `
    <div class="fp-header">
      <span class="fp-title">FocusProof</span>
      <button class="fp-minimize-btn" id="fp-minimize" title="Thu nhỏ">─</button>
    </div>
    <div class="fp-score-row">
      <div class="fp-score-ring" style="background: ${gradient}">
        ${score}%
      </div>
      <div>
        <div class="fp-timer">${timeStr}</div>
        <div class="fp-timer-label">còn lại</div>
      </div>
    </div>
    <div class="fp-indicators">
      <div class="fp-indicator ${faceDetected ? 'fp-indicator--ok' : 'fp-indicator--warn'}">
        <span class="fp-indicator-icon">${faceDetected ? '😊' : '😶'}</span>
        <span>Face</span>
      </div>
      <div class="fp-indicator ${!isIdle ? 'fp-indicator--ok' : 'fp-indicator--warn'}">
        <span class="fp-indicator-icon">${!isIdle ? '⌨️' : '💤'}</span>
        <span>Activity</span>
      </div>
      <div class="fp-indicator ${goalCompliant ? 'fp-indicator--ok' : 'fp-indicator--warn'}">
        <span class="fp-indicator-icon">${goalCompliant ? '✅' : '🚫'}</span>
        <span>Tab</span>
      </div>
      <div class="fp-indicator fp-indicator--ok">
        <span class="fp-indicator-icon">🔔</span>
        <span>Alert</span>
      </div>
    </div>
  `;
}

// ============================================================
// Drag & Drop
// ============================================================

function onDragStart(e: MouseEvent) {
  if (isMinimized) return;
  if ((e.target as HTMLElement).id === 'fp-minimize') return;

  isDragging = true;
  const rect = hostElement!.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  const container = shadowRoot?.getElementById('fp-container');
  container?.classList.add('fp-dragging');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(e: MouseEvent) {
  if (!isDragging || !hostElement) return;

  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;

  // Clamp to viewport
  const maxX = window.innerWidth - (hostElement.offsetWidth || 200);
  const maxY = window.innerHeight - (hostElement.offsetHeight || 150);

  hostElement.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
  hostElement.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
  hostElement.style.right = 'auto';
  hostElement.style.bottom = 'auto';
}

function onDragEnd() {
  isDragging = false;
  const container = shadowRoot?.getElementById('fp-container');
  container?.classList.remove('fp-dragging');

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
}
