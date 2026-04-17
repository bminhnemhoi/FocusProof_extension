/**
 * FocusProof – Certificate PDF Generator
 * Tạo chứng chỉ PDF 2 trang (A4 Landscape).
 *
 * Trang 1: Focus Score lớn (gradient circle), thông tin phiên
 *          (task, goal, allowed domains, thời gian, số mẫu, camera status),
 *          top domains, SHA-256 hash, QR code, watermark.
 *
 * Trang 2: Phân tích AI chi tiết (nếu có), recommendations,
 *          focus pattern, signal breakdown.
 *
 * Font: Roboto (embedded TTF, hỗ trợ Vietnamese/Unicode).
 * Watermark: "FocusProof Certified • SHA-256 Verified"
 *
 * Reference: y_tuong.md Section 2.3 – Chứng chỉ PDF 2 trang
 */

import { jsPDF } from 'jspdf';
import type { CertificateData, AIAnalysisResult, SessionData } from './types';
import { getGrade } from './focus';
import { computeSessionStats } from './focus';
import { generateQRDataUrl } from './qr-code';

// ============================================================
// Constants
// ============================================================

const PAGE_W = 297; // A4 landscape width mm
const PAGE_H = 210; // A4 landscape height mm
const MARGIN = 15;
const PRIMARY_COLOR: [number, number, number] = [99, 102, 241];
const TEXT_COLOR: [number, number, number] = [30, 41, 59];
const TEXT_SECONDARY: [number, number, number] = [100, 116, 139];
const WATERMARK_COLOR: [number, number, number] = [200, 200, 220];

/** Font name used in jsPDF after embedding Roboto */
const FONT_NAME = 'Roboto';

// ============================================================
// Font Embedding (Vietnamese/Unicode support)
// ============================================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load Roboto TTF fonts from extension's public/fonts/ and embed into jsPDF.
 * Falls back to helvetica if fetch fails (e.g., test environment).
 */
async function embedFonts(doc: jsPDF): Promise<string> {
  try {
    const baseUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('public/fonts/')
      : '/public/fonts/';

    const [regularBuf, boldBuf, italicBuf] = await Promise.all([
      fetch(`${baseUrl}Roboto-Regular.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}Roboto-Bold.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${baseUrl}Roboto-Italic.ttf`).then((r) => r.arrayBuffer()),
    ]);

    doc.addFileToVFS('Roboto-Regular.ttf', arrayBufferToBase64(regularBuf));
    doc.addFont('Roboto-Regular.ttf', FONT_NAME, 'normal');

    doc.addFileToVFS('Roboto-Bold.ttf', arrayBufferToBase64(boldBuf));
    doc.addFont('Roboto-Bold.ttf', FONT_NAME, 'bold');

    doc.addFileToVFS('Roboto-Italic.ttf', arrayBufferToBase64(italicBuf));
    doc.addFont('Roboto-Italic.ttf', FONT_NAME, 'italic');

    return FONT_NAME;
  } catch (err) {
    console.warn('[Certificate] Failed to load Roboto fonts, falling back to helvetica:', err);
    return 'helvetica';
  }
}

// ============================================================
// Helpers
// ============================================================

/** Vẽ grade circle lớn (mô phỏng gradient bằng filled circles) */
function drawScoreCircle(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  gradeColor: string,
  font: string,
) {
  // Outer ring
  const [r, g, b] = hexToRgb(gradeColor);
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(3);
  doc.circle(cx, cy, radius, 'S');

  // Score text
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(42);
  doc.setFont(font, 'bold');
  doc.text(String(Math.round(score)), cx, cy - 2, { align: 'center' });

  // "/100" subscript
  doc.setFontSize(14);
  doc.setFont(font, 'normal');
  doc.text('/100', cx, cy + 10, { align: 'center' });

  // Grade label below circle
  doc.setFontSize(18);
  doc.setFont(font, 'bold');
  doc.setTextColor(r, g, b);
  const grade = getGrade(score);
  doc.text(`${grade.grade} – ${grade.labelEn}`, cx, cy + radius + 10, { align: 'center' });
}

/** Vẽ watermark chéo */
function drawWatermark(doc: jsPDF, font: string) {
  doc.setTextColor(...WATERMARK_COLOR);
  doc.setFontSize(36);
  doc.setFont(font, 'bold');

  // Save state
  const ctx = doc.context2d;
  if (ctx) {
    ctx.save();
    ctx.translate(PAGE_W / 2, PAGE_H / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.globalAlpha = 0.08;
  }

  // Fallback: vẽ text trực tiếp với opacity thấp (jsPDF basic)
  doc.setGState(doc.GState({ opacity: 0.08 }));
  doc.text('FocusProof Certified', PAGE_W / 2, PAGE_H / 2 - 10, {
    align: 'center',
    angle: 30,
  });
  doc.text('SHA-256 Verified', PAGE_W / 2, PAGE_H / 2 + 15, {
    align: 'center',
    angle: 30,
  });
  doc.setGState(doc.GState({ opacity: 1 }));
}

/** Hex color → RGB tuple */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/** Format thời gian domain (giây → chuỗi dễ đọc) */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}p ${s}s` : `${m}p`;
}

/** Format timestamp → readable date string */
function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Helper: draw a labeled info row */
function drawInfoRow(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  font: string,
): number {
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(label, x, y);
  doc.setTextColor(...TEXT_COLOR);
  doc.setFont(font, 'bold');
  doc.text(value, x + 55, y);
  return y + 7;
}

// ============================================================
// Page 1: Certificate Overview
// ============================================================

function renderPage1(doc: jsPDF, data: CertificateData, font: string) {
  const { session, qrDataUrl } = data;
  const score = session.finalScore ?? 0;
  const gradeInfo = getGrade(score);
  const stats = computeSessionStats(session);
  const durationMin = session.endTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : session.config.durationMinutes;

  // ── Header bar ──
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, PAGE_W, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(font, 'bold');
  doc.text('FOCUSPROOF CERTIFICATE', MARGIN, 12);
  doc.setFontSize(9);
  doc.setFont(font, 'normal');
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, PAGE_W - MARGIN, 12, { align: 'right' });

  // ── Watermark ──
  drawWatermark(doc, font);

  // ── Score Circle (left section) ──
  drawScoreCircle(doc, 70, 80, 30, score, gradeInfo.color, font);

  // ── Task & Session Info (center-right) ──
  const infoX = 130;
  let infoY = 35;

  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(16);
  doc.setFont(font, 'bold');
  doc.text(session.config.taskName, infoX, infoY);
  infoY += 12;

  infoY = drawInfoRow(doc, infoX, infoY, 'Mode:', session.config.mode, font);
  infoY = drawInfoRow(doc, infoX, infoY, 'Duration:', `${durationMin} minutes`, font);
  infoY = drawInfoRow(doc, infoX, infoY, 'Samples:', String(stats.totalSamples), font);
  infoY = drawInfoRow(doc, infoX, infoY, 'Camera:', session.config.cameraEnabled ? 'ON' : 'OFF', font);
  infoY = drawInfoRow(
    doc,
    infoX,
    infoY,
    'Compliance:',
    `${Math.round(stats.tabComplianceRate * 100)}%`,
    font,
  );
  if (session.config.strictMode) {
    infoY = drawInfoRow(doc, infoX, infoY, 'Strict Mode:', 'Enabled', font);
  }
  infoY = drawInfoRow(doc, infoX, infoY, 'Alerts:', String(stats.alertCount), font);

  // ── Allowed Domains ──
  if (session.config.allowedDomains.length > 0) {
    infoY += 3;
    doc.setFont(font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text('Allowed Domains:', infoX, infoY);
    infoY += 5;
    doc.setTextColor(...TEXT_COLOR);
    const domainStr = session.config.allowedDomains.slice(0, 8).join(', ');
    const lines = doc.splitTextToSize(domainStr, PAGE_W - infoX - MARGIN - 60);
    doc.text(lines, infoX, infoY);
    infoY += lines.length * 4.5;
  }

  // ── Top Domains (horizontal bar chart, left column) ──
  if (stats.topDomains.length > 0) {
    const domainStartY = 130;
    doc.setFont(font, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_COLOR);
    doc.text('Top Domains', MARGIN, domainStartY);

    const maxDur = Math.max(...stats.topDomains.map((d) => d.durationSeconds));
    const chartBarW = 45; // bar width fits left column
    const domainLabelW = 38; // domain label width
    const bx = MARGIN + domainLabelW;

    doc.setFontSize(8);
    let dy = domainStartY + 7;
    for (const { domain, count, durationSeconds } of stats.topDomains.slice(0, 5)) {
      // Domain label (truncated)
      doc.setFont(font, 'normal');
      doc.setTextColor(...TEXT_COLOR);
      const label = domain.length > 16 ? domain.slice(0, 14) + '…' : domain;
      doc.text(label, MARGIN, dy);

      // Background bar
      doc.setFillColor(226, 232, 240);
      doc.rect(bx, dy - 3, chartBarW, 3.5, 'F');

      // Filled bar
      const ratio = maxDur > 0 ? durationSeconds / maxDur : 0;
      doc.setFillColor(...PRIMARY_COLOR);
      doc.rect(bx, dy - 3, chartBarW * ratio, 3.5, 'F');

      // Duration + count label
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text(`${count}× ${formatDuration(durationSeconds)}`, bx + chartBarW + 2, dy);
      dy += 6;
    }
  }

  // ── Signal Breakdown (simple bar) ──
  const barY = 130;
  const barX = 130;
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_COLOR);
  doc.text('Signal Breakdown', barX, barY);

  const signals = [
    { label: 'Face Confidence', value: stats.avgFaceConfidence },
    { label: 'Activity', value: stats.avgActivityScore },
    { label: 'Tab Compliance', value: stats.tabComplianceRate },
  ];

  let sy = barY + 8;
  for (const sig of signals) {
    doc.setFont(font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(sig.label, barX, sy);

    // Background bar
    const barWidth = 80;
    const barHeight = 4;
    const bx = barX + 45;
    doc.setFillColor(226, 232, 240);
    doc.rect(bx, sy - 3.5, barWidth, barHeight, 'F');

    // Filled bar
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(bx, sy - 3.5, barWidth * Math.min(1, sig.value), barHeight, 'F');

    // Percentage
    doc.setTextColor(...TEXT_COLOR);
    doc.text(`${Math.round(sig.value * 100)}%`, bx + barWidth + 3, sy);
    sy += 9;
  }

  // ── QR Code (bottom-right) ──
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', PAGE_W - MARGIN - 35, PAGE_H - 50, 35, 35);
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text('Scan to verify', PAGE_W - MARGIN - 17.5, PAGE_H - 12, { align: 'center' });
  }

  // ── Hash (bottom-left) ──
  if (session.hash) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(`SHA-256: ${session.hash}`, MARGIN, PAGE_H - 10);
  }

  // ── Footer line ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - 16, PAGE_W - MARGIN, PAGE_H - 16);
}

// ============================================================
// Page 2: AI Analysis
// ============================================================

function renderPage2(doc: jsPDF, data: CertificateData, font: string) {
  const { session, aiAnalysis } = data;

  // ── Header bar ──
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, PAGE_W, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(font, 'bold');
  doc.text('FOCUSPROOF – AI ANALYSIS', MARGIN, 12);
  doc.setFontSize(9);
  doc.setFont(font, 'normal');
  doc.text(session.config.taskName, PAGE_W - MARGIN, 12, { align: 'right' });

  // ── Watermark ──
  drawWatermark(doc, font);

  let y = 32;

  if (!aiAnalysis) {
    doc.setTextColor(...TEXT_SECONDARY);
    doc.setFontSize(12);
    doc.setFont(font, 'italic');
    doc.text('AI Analysis was not performed for this session.', PAGE_W / 2, 80, {
      align: 'center',
    });
    doc.text('Enable AI opt-in in Settings to get detailed analysis.', PAGE_W / 2, 92, {
      align: 'center',
    });
    y = 105;
  } else {
    // ── Summary (Vietnamese) ──
    doc.setFont(font, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...TEXT_COLOR);
    doc.text('Tóm tắt (Tiếng Việt)', MARGIN, y);
    y += 7;
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    const viLines = doc.splitTextToSize(aiAnalysis.summaryVi, PAGE_W - 2 * MARGIN);
    doc.text(viLines, MARGIN, y);
    y += viLines.length * 5 + 6;

    // ── Summary (English) ──
    doc.setFont(font, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...TEXT_COLOR);
    doc.text('Summary (English)', MARGIN, y);
    y += 7;
    doc.setFont(font, 'normal');
    doc.setFontSize(10);
    const enLines = doc.splitTextToSize(aiAnalysis.summaryEn, PAGE_W - 2 * MARGIN);
    doc.text(enLines, MARGIN, y);
    y += enLines.length * 5 + 6;

    // ── Focus Pattern ──
    if (aiAnalysis.focusPattern) {
      doc.setFont(font, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...TEXT_COLOR);
      doc.text('Focus Pattern', MARGIN, y);
      y += 7;
      doc.setFont(font, 'normal');
      doc.setFontSize(10);
      const patternLines = doc.splitTextToSize(aiAnalysis.focusPattern, PAGE_W - 2 * MARGIN);
      doc.text(patternLines, MARGIN, y);
      y += patternLines.length * 5 + 6;
    }

    // ── Recommendations ──
    if (aiAnalysis.recommendations.length > 0) {
      doc.setFont(font, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...TEXT_COLOR);
      doc.text('Recommendations', MARGIN, y);
      y += 7;

      doc.setFont(font, 'normal');
      doc.setFontSize(10);
      for (const rec of aiAnalysis.recommendations) {
        doc.setTextColor(...PRIMARY_COLOR);
        doc.text('•', MARGIN + 2, y);
        doc.setTextColor(...TEXT_COLOR);
        const recLines = doc.splitTextToSize(rec, PAGE_W - 2 * MARGIN - 10);
        doc.text(recLines, MARGIN + 7, y);
        y += recLines.length * 5 + 3;
      }
    }
  }

  // ── Footer ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - 16, PAGE_W - MARGIN, PAGE_H - 16);
  doc.setFont(font, 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(
    'Analysis powered by GPT-4o-mini. Results are for reference only.',
    MARGIN,
    PAGE_H - 10,
  );
}

// ============================================================
// Public API
// ============================================================

/**
 * Tạo chứng chỉ PDF 2 trang và trả về dưới dạng Blob.
 *
 * @param session - Phiên đã hoàn thành
 * @param aiAnalysis - Kết quả phân tích AI (optional)
 * @returns PDF Blob, sẵn sàng download
 */
export async function generateCertificatePDF(
  session: SessionData,
  aiAnalysis?: AIAnalysisResult,
): Promise<Blob> {
  // Generate QR code
  const qrDataUrl = await generateQRDataUrl(session);

  const certData: CertificateData = {
    session,
    aiAnalysis,
    qrDataUrl,
    generatedAt: Date.now(),
  };

  // Create PDF (A4 Landscape)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Embed Roboto font for Vietnamese/Unicode support
  const font = await embedFonts(doc);

  // Page 1: Overview
  renderPage1(doc, certData, font);

  // Page 2: AI Analysis
  doc.addPage('a4', 'landscape');
  renderPage2(doc, certData, font);

  return doc.output('blob');
}

/**
 * Tạo PDF và trigger download trong browser.
 */
export async function downloadCertificate(
  session: SessionData,
  aiAnalysis?: AIAnalysisResult,
): Promise<void> {
  const blob = await generateCertificatePDF(session, aiAnalysis);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FocusProof_${session.config.taskName.replace(/[^a-zA-Z0-9]/g, '_')}_${session.id.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
