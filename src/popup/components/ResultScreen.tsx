/**
 * FocusProof – ResultScreen Component
 * Hiển thị kết quả phiên: final score, grade, badges, timeline summary.
 * Phase 3: Xuất PDF, AI Analysis, Voice Note.
 *
 * Reference: y_tuong.md Section 2.3 – Kết quả & Phân tích
 */

import { useState, useRef, useCallback } from 'react';
import type { SessionData, AIAnalysisResult, GoalConfig } from '@/utils/types';
import { getGrade } from '@/utils/focus';
import { isGoalCompliant } from '@/utils/goal-evaluator';
import { startVoiceNote, isSpeechRecognitionSupported } from '@/utils/voice-note';
import { BADGE_DEFINITIONS } from '@/utils/gamification';
import type { VoiceNoteResult } from '@/utils/voice-note';

/** Map badge ID → tên tiếng Việt */
const BADGE_NAME_MAP = Object.fromEntries(
  BADGE_DEFINITIONS.map((b) => [b.id, { name: b.name, desc: b.description }]),
);

interface ResultScreenProps {
  session: SessionData;
  onNewSession: () => void;
  onHistory: () => void;
}

export default function ResultScreen({ session, onNewSession, onHistory }: ResultScreenProps) {
  const score = session.finalScore ?? 0;
  const gradeInfo = getGrade(score);
  const durationMinutes = session.endTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : session.config.durationMinutes;

  const totalSamples = session.samples.length;
  const compliantSamples = session.samples.filter((s) => s.goalCompliant).length;
  const complianceRate = totalSamples > 0 ? Math.round((compliantSamples / totalSamples) * 100) : 0;

  // Top domains
  const domainMap = new Map<string, number>();
  for (const s of session.samples) {
    const d = s.tab.currentDomain;
    if (d && d !== '__outside_chrome__') {
      domainMap.set(d, (domainMap.get(d) ?? 0) + 1);
    }
  }
  const topDomains = Array.from(domainMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /* ── Phase 3: PDF / AI / Voice Note state ── */
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiTrendMode, setAiTrendMode] = useState(false);

  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const voiceStopRef = useRef<(() => void) | null>(null);

  /** Xuất chứng chỉ PDF */
  const handleDownloadPDF = useCallback(async () => {
    setPdfLoading(true);
    setPdfError('');
    try {
      const { downloadCertificate } = await import('@/utils/certificate');
      await downloadCertificate(session, aiResult ?? undefined);
    } catch (err: unknown) {
      setPdfError(err instanceof Error ? err.message : 'Lỗi tạo PDF');
    } finally {
      setPdfLoading(false);
    }
  }, [session, aiResult]);

  /** Phân tích AI (single hoặc trend) */
  const handleAIAnalysis = useCallback(async (includeTrend = false) => {
    setAiLoading(true);
    setAiError('');
    setAiTrendMode(includeTrend);
    try {
      const { analyzeSession } = await import('@/utils/ai-analysis');
      const result = await analyzeSession(
        session,
        undefined,
        voiceText || undefined,
        includeTrend ? { includeTrend: true } : undefined,
      );
      setAiResult(result);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Lỗi phân tích AI');
    } finally {
      setAiLoading(false);
    }
  }, [session, voiceText]);

  /** Voice Note: bắt đầu / dừng ghi âm */
  const handleVoiceNote = useCallback(() => {
    if (voiceRecording) {
      // Dừng ghi
      voiceStopRef.current?.();
      voiceStopRef.current = null;
      setVoiceRecording(false);
      return;
    }

    setVoiceError('');
    setVoiceRecording(true);

    const { promise, stop } = startVoiceNote();
    voiceStopRef.current = stop;

    promise
      .then((result: VoiceNoteResult) => {
        setVoiceText(result.text);
      })
      .catch((err: Error) => {
        setVoiceError(err.message);
      })
      .finally(() => {
        setVoiceRecording(false);
        voiceStopRef.current = null;
      });
  }, [voiceRecording]);

  return (
    <div className="result-screen">
      {/* Score Circle */}
      <div className="result-score-section">
        <div
          className="result-score-circle"
          style={{ '--grade-color': gradeInfo.color } as React.CSSProperties}
        >
          <span className="result-score-value">{Math.round(score)}</span>
          <span className="result-score-unit">/100</span>
        </div>
        <span className="result-grade" style={{ color: gradeInfo.color }}>
          {gradeInfo.grade} – {gradeInfo.label}
        </span>
      </div>

      {/* Session Info */}
      <div className="result-info">
        <h3 className="result-task">{session.config.taskName}</h3>
        <div className="result-meta">
          <span>{session.config.mode}</span>
          <span>•</span>
          <span>{durationMinutes} phút</span>
          <span>•</span>
          <span>{totalSamples} mẫu</span>
        </div>
      </div>

      {/* Stats */}
      <div className="result-stats">
        <div className="result-stat-row">
          <span className="result-stat-label">Tuân thủ mục tiêu</span>
          <span className="result-stat-value">{complianceRate}%</span>
        </div>
        <div className="result-stat-row">
          <span className="result-stat-label">Camera</span>
          <span className="result-stat-value">
            {session.config.cameraEnabled ? 'Bật' : 'Tắt'}
          </span>
        </div>
        {session.config.strictMode && (
          <div className="result-stat-row">
            <span className="result-stat-label">Strict Mode</span>
            <span className="result-stat-value">✓</span>
          </div>
        )}
      </div>

      {/* Badges */}
      {session.badges.length > 0 && (
        <div className="result-badges">
          <p className="result-badges-title">🏆 Huy hiệu đạt được</p>
          <div className="badges-grid">
            {session.badges.map((badgeId) => (
              <span key={badgeId} className="badge-chip" title={BADGE_NAME_MAP[badgeId]?.desc ?? badgeId}>
                {BADGE_NAME_MAP[badgeId]?.name ?? badgeId.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Domains */}
      {topDomains.length > 0 && (
        <div className="result-domains">
          <p className="result-domains-title">🌐 Domain truy cập</p>
          <div className="domain-list">
            {topDomains.map(([domain, count]) => {
              const secs = count * 6;
              const durStr = secs < 60 ? `~${secs}s` : `~${Math.floor(secs / 60)}p${secs % 60 > 0 ? `${secs % 60}s` : ''}`;
              return (
                <div key={domain} className="domain-row">
                  <span className="domain-name">{domain}</span>
                  <span className="domain-count">{count}× – {durStr}</span>
                </div>
              );
            })}
          </div>

          {/* Horizontal bar chart — thời gian truy cập */}
          <div className="domain-bar-chart">
            {(() => {
              const maxSecs = Math.max(...topDomains.map(([, c]) => c * 6));
              return topDomains.map(([domain, count]) => {
                const secs = count * 6;
                const pct = maxSecs > 0 ? (secs / maxSecs) * 100 : 0;
                const durStr = secs < 60 ? `~${secs}s` : `~${Math.floor(secs / 60)}p${secs % 60 > 0 ? `${secs % 60}s` : ''}`;
                return (
                  <div key={domain} className="domain-bar-row">
                    <span className="domain-bar-label">{domain}</span>
                    <div className="domain-bar-track">
                      <div
                        className="domain-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="domain-bar-value">{durStr}</span>
                  </div>
                );
              });
            })()}
          </div>

          {/* Pie chart — phân bổ thời gian domain */}
          {(() => {
            const goalConfig: GoalConfig = {
              mode: session.config.mode,
              customAllowedDomains: session.config.allowedDomains,
              customExternalRule: session.config.allowExternalApps,
            };
            const totalSecs = topDomains.reduce((sum, [, c]) => sum + c * 6, 0);
            if (totalSecs === 0) return null;

            // Color palettes: shades of green (compliant) and red (non-compliant)
            const GREEN_SHADES = ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac'];
            const RED_SHADES = ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#fca5a5'];
            let greenIdx = 0;
            let redIdx = 0;

            const cx = 60;
            const cy = 60;
            const r = 50;
            let cumulativeAngle = -Math.PI / 2; // start at top

            const slices = topDomains.map(([domain, count]) => {
              const secs = count * 6;
              const fraction = secs / totalSecs;
              const startAngle = cumulativeAngle;
              const sliceAngle = fraction * 2 * Math.PI;
              const midAngle = startAngle + sliceAngle / 2;
              cumulativeAngle += sliceAngle;
              const endAngle = cumulativeAngle;
              const largeArc = sliceAngle > Math.PI ? 1 : 0;
              const compliant = isGoalCompliant(domain, goalConfig);
              const color = compliant
                ? GREEN_SHADES[greenIdx++ % GREEN_SHADES.length]
                : RED_SHADES[redIdx++ % RED_SHADES.length];

              const durStr = secs < 60 ? `~${secs}s` : `~${Math.floor(secs / 60)}p${secs % 60 > 0 ? `${secs % 60}s` : ''}`;

              // For single-domain (100%), draw a full circle
              if (topDomains.length === 1) {
                return { domain, fraction, color, compliant, path: null, midAngle, durStr };
              }

              const x1 = cx + r * Math.cos(startAngle);
              const y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle);
              const y2 = cy + r * Math.sin(endAngle);
              const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              return { domain, fraction, color, compliant, path: d, midAngle, durStr };
            });

            return (
              <div className="domain-pie-section">
                <p className="domain-pie-title">📊 Phân bổ thời gian</p>
                <div className="domain-pie-container">
                  <svg
                    className="domain-pie-svg"
                    viewBox="0 0 120 120"
                    width="120"
                    height="120"
                    aria-label="Biểu đồ tròn thời gian truy cập domain"
                  >
                    {slices.map((s) =>
                      s.path ? (
                        <path
                          key={s.domain}
                          d={s.path}
                          fill={s.color}
                          stroke="#fff"
                          strokeWidth="1"
                        />
                      ) : (
                        <circle
                          key={s.domain}
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill={s.color}
                        />
                      ),
                    )}
                    {/* % labels on slices > 8% */}
                    {slices.map((s) => {
                      if (s.fraction <= 0.08 || topDomains.length === 1) return null;
                      const lx = cx + r * 0.6 * Math.cos(s.midAngle);
                      const ly = cy + r * 0.6 * Math.sin(s.midAngle);
                      return (
                        <text
                          key={`lbl-${s.domain}`}
                          x={lx}
                          y={ly}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#fff"
                          fontSize="9"
                          fontWeight="700"
                        >
                          {Math.round(s.fraction * 100)}%
                        </text>
                      );
                    })}
                  </svg>
                  <div className="domain-pie-legend">
                    {slices.map((s) => (
                      <div key={s.domain} className="pie-legend-item">
                        <span
                          className="pie-legend-dot"
                          style={{ background: s.color }}
                        />
                        <span className="pie-legend-domain">{s.domain}</span>
                        <span className="pie-legend-pct">{Math.round(s.fraction * 100)}%</span>
                        <span className="pie-legend-dur">{s.durStr}</span>
                      </div>
                    ))}
                    <div className="pie-legend-hint">
                      <span className="pie-legend-dot" style={{ background: '#22c55e' }} />
                      <span>Phù hợp mục tiêu</span>
                      <span className="pie-legend-dot" style={{ background: '#ef4444', marginLeft: 8 }} />
                      <span>Không phù hợp</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Hash */}
      {session.hash && (
        <div className="result-hash">
          <span className="hash-label">SHA-256</span>
          <code className="hash-value">{session.hash.slice(0, 16)}...</code>
        </div>
      )}

      {/* ── Voice Note ── */}
      <div className="result-voice-section" aria-live="polite">
        <p className="result-section-title">🎤 Voice Note (tùy chọn)</p>
        {isSpeechRecognitionSupported() ? (
          <>
            <div className="voice-controls">
              <button
                className={`btn ${voiceRecording ? 'btn-danger' : 'btn-secondary'} btn-full`}
                onClick={handleVoiceNote}
                type="button"
              >
                {voiceRecording ? '⏹ Dừng ghi (tối đa 30s)' : '🎙️ Ghi âm tóm tắt'}
              </button>
            </div>
            {voiceText && (
              <div className="voice-transcript">
                <p className="voice-transcript-label">Nội dung:</p>
                <p className="voice-transcript-text">{voiceText}</p>
              </div>
            )}
            {voiceError && <p className="form-hint form-hint--warning">{voiceError}</p>}
          </>
        ) : (
          <p className="form-hint">Trình duyệt không hỗ trợ Speech Recognition.</p>
        )}
      </div>

      {/* ── AI Analysis ── */}
      <div className="result-ai-section" aria-live="polite">
        <div className="ai-buttons-row">
          <button
            className="btn btn-secondary btn-full"
            onClick={() => handleAIAnalysis(false)}
            disabled={aiLoading || (!!aiResult && !aiTrendMode)}
            type="button"
          >
            {aiLoading && !aiTrendMode ? '🔄 Đang phân tích...' : aiResult && !aiTrendMode ? '✅ Đã phân tích' : '🤖 Phân tích phiên này'}
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => handleAIAnalysis(true)}
            disabled={aiLoading || (!!aiResult && aiTrendMode)}
            type="button"
          >
            {aiLoading && aiTrendMode ? '🔄 Đang phân tích...' : aiResult && aiTrendMode ? '✅ Đã phân tích' : '📊 Phân tích xu hướng'}
          </button>
        </div>
        {aiError && <p className="form-hint form-hint--warning">{aiError}</p>}
        {aiResult && (
          <div className="ai-result-card">
            <div className="ai-summary">
              <p className="ai-summary-vi">{aiResult.summaryVi}</p>
              <p className="ai-summary-en">{aiResult.summaryEn}</p>
            </div>
            {aiResult.focusPattern && (
              <p className="ai-pattern">
                <strong>Pattern:</strong> {aiResult.focusPattern}
              </p>
            )}
            {aiResult.recommendations.length > 0 && (
              <div className="ai-recommendations">
                <p className="ai-rec-title">Gợi ý cải thiện:</p>
                <ul className="ai-rec-list">
                  {aiResult.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PDF Certificate ── */}
      <div aria-live="polite">
      <button
        className="btn btn-primary btn-full"
        onClick={handleDownloadPDF}
        disabled={pdfLoading}
        aria-label="Xuất chứng chỉ PDF"
        type="button"
      >
        {pdfLoading ? '🔄 Đang tạo PDF...' : '📄 Xuất chứng chỉ PDF'}
      </button>
      {pdfError && <p className="form-hint form-hint--warning" role="alert">{pdfError}</p>}
      </div>

      {/* ── Share Buttons ── */}
      <div className="result-share-section">
        <p className="result-section-title">📤 Chia sẻ kết quả</p>
        <div className="share-buttons-row">
          <button
            className="btn btn-share btn-share--facebook"
            onClick={() => {
              const text = `🎯 FocusProof: Tôi đạt ${Math.round(score)}/100 điểm tập trung trong phiên "${session.config.taskName}"! #FocusProof`;
              window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
            }}
            type="button"
          >
            📘 Facebook
          </button>
          <button
            className="btn btn-share btn-share--tiktok"
            onClick={() => {
              const text = `🎯 FocusProof: ${Math.round(score)}/100 điểm tập trung! "${session.config.taskName}" #FocusProof #TapTrung`;
              navigator.clipboard.writeText(text).then(() => {
                alert('Đã copy nội dung! Paste vào TikTok để chia sẻ.');
              });
            }}
            type="button"
          >
            🎵 TikTok
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-row">
        <button className="btn btn-primary btn-full" onClick={onNewSession} type="button">
          🎯 Phiên mới
        </button>
        <button className="btn btn-secondary btn-full" onClick={onHistory} type="button">
          📊 Lịch sử
        </button>
      </div>
    </div>
  );
}
