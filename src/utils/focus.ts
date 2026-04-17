/**
 * FocusProof – Focus Score Calculator
 * Thuật toán tính điểm tập trung theo trọng số.
 * Reference: y_tuong.md Section logic scoring
 *
 * Camera ON:  Face(40%) + Activity(35%) + Tab/Screen(25%)
 * Camera OFF: Activity(60%) + Tab/Screen(40%)
 *
 * Mỗi tín hiệu được normalize về 0–1 trước khi nhân trọng số.
 */

import type { FaceResult, ActivityResult, Sample, SessionData } from './types';
import { WEIGHTS_CAMERA_ON, WEIGHTS_CAMERA_OFF } from './types';

// ============================================================
// Activity Normalization Thresholds (per 6-second window)
// ============================================================

/** Ngưỡng hoạt động tối đa trong 6 giây để normalize */
const ACTIVITY_THRESHOLDS = {
  keystrokes: 30, // ~5 phím/giây là rất tích cực
  clicks: 6, // ~1 click/giây
  scrolls: 10, // ~1.6 scroll events/giây
} as const;

// ============================================================
// Signal Normalization (0–1)
// ============================================================

/**
 * Normalize kết quả face detection thành điểm 0–1.
 * - Không phát hiện mặt → 0
 * - Phát hiện → confidence score (đã là 0–1 từ MediaPipe)
 */
export function normalizeFace(face: FaceResult): number {
  if (!face.detected) return 0;
  return Math.min(1, Math.max(0, face.confidence));
}

/**
 * Normalize activity data thành điểm 0–1.
 * - idle → 0
 * - Tổng hợp keystrokes + clicks + scrolls, normalize theo threshold
 */
export function normalizeActivity(activity: ActivityResult): number {
  if (activity.idle) return 0;

  const keyScore = Math.min(1, activity.keystrokes / ACTIVITY_THRESHOLDS.keystrokes);
  const clickScore = Math.min(1, activity.clicks / ACTIVITY_THRESHOLDS.clicks);
  const scrollScore = Math.min(1, activity.scrolls / ACTIVITY_THRESHOLDS.scrolls);

  // Trung bình có trọng số: keystrokes quan trọng nhất
  return Math.min(1, keyScore * 0.5 + clickScore * 0.3 + scrollScore * 0.2);
}

/**
 * Tab compliance score: 1.0 nếu phù hợp mục tiêu, 0.0 nếu không.
 */
export function normalizeTab(goalCompliant: boolean): number {
  return goalCompliant ? 1.0 : 0.0;
}

// ============================================================
// Focus Score Calculation
// ============================================================

/**
 * Tính focus score cho một sample (0–1).
 *
 * @param face - Kết quả face detection
 * @param activity - Kết quả activity tracking
 * @param goalCompliant - Tab/screen có phù hợp mục tiêu không
 * @param cameraEnabled - Phiên có bật camera không (quyết định trọng số)
 */
export function calculateSampleScore(
  face: FaceResult,
  activity: ActivityResult,
  goalCompliant: boolean,
  cameraEnabled: boolean,
): number {
  const activityScore = normalizeActivity(activity);
  const tabScore = normalizeTab(goalCompliant);

  if (cameraEnabled) {
    const faceScore = normalizeFace(face);
    return (
      faceScore * WEIGHTS_CAMERA_ON.face +
      activityScore * WEIGHTS_CAMERA_ON.activity +
      tabScore * WEIGHTS_CAMERA_ON.tab
    );
  }

  // Camera OFF: chỉ dùng Activity + Tab
  return activityScore * WEIGHTS_CAMERA_OFF.activity + tabScore * WEIGHTS_CAMERA_OFF.tab;
}

// ============================================================
// Final Session Score
// ============================================================

/**
 * Tính điểm cuối cùng cho toàn bộ phiên (0–100).
 * Trung bình có trọng số của tất cả samples.
 */
export function calculateFinalScore(samples: Sample[]): number {
  if (samples.length === 0) return 0;

  const sum = samples.reduce((acc, s) => acc + s.focusScore, 0);
  const avg = sum / samples.length;

  // Chuyển từ 0–1 sang 0–100, làm tròn 1 chữ số
  return Math.round(avg * 1000) / 10;
}

// ============================================================
// Grade System
// ============================================================

export type FocusGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeInfo {
  grade: FocusGrade;
  label: string;
  labelEn: string;
  color: string;
}

/**
 * Phân loại điểm thành grade (S → F).
 */
export function getGrade(score: number): GradeInfo {
  if (score >= 95) return { grade: 'S', label: 'Xuất sắc', labelEn: 'Outstanding', color: '#FFD700' };
  if (score >= 85) return { grade: 'A', label: 'Giỏi', labelEn: 'Excellent', color: '#22C55E' };
  if (score >= 70) return { grade: 'B', label: 'Khá', labelEn: 'Good', color: '#3B82F6' };
  if (score >= 55) return { grade: 'C', label: 'Trung bình', labelEn: 'Average', color: '#F59E0B' };
  if (score >= 40) return { grade: 'D', label: 'Yếu', labelEn: 'Below Average', color: '#F97316' };
  return { grade: 'F', label: 'Kém', labelEn: 'Poor', color: '#EF4444' };
}

// ============================================================
// Session Statistics (dùng cho AI Analysis & Certificate)
// ============================================================

export interface SessionStats {
  totalSamples: number;
  durationSeconds: number;
  avgFaceConfidence: number;
  avgActivityScore: number;
  tabComplianceRate: number;
  alertCount: number;
  topDomains: Array<{ domain: string; count: number }>;
}

/**
 * Tính toán thống kê tổng hợp cho session.
 */
export function computeSessionStats(session: SessionData): SessionStats {
  const { samples } = session;
  const totalSamples = samples.length;

  if (totalSamples === 0) {
    return {
      totalSamples: 0,
      durationSeconds: 0,
      avgFaceConfidence: 0,
      avgActivityScore: 0,
      tabComplianceRate: 0,
      alertCount: 0,
      topDomains: [],
    };
  }

  // Duration
  const durationSeconds = session.endTime
    ? Math.round((session.endTime - session.startTime) / 1000)
    : 0;

  // Average face confidence
  const avgFaceConfidence =
    samples.reduce((sum, s) => sum + s.face.confidence, 0) / totalSamples;

  // Average activity score
  const avgActivityScore =
    samples.reduce((sum, s) => sum + normalizeActivity(s.activity), 0) / totalSamples;

  // Tab compliance rate (% samples phù hợp mục tiêu)
  const compliantCount = samples.filter((s) => s.goalCompliant).length;
  const tabComplianceRate = compliantCount / totalSamples;

  // Top domains (đếm tần suất)
  const domainMap = new Map<string, number>();
  for (const s of samples) {
    const domain = s.tab.currentDomain || s.tab.currentUrl;
    if (domain) {
      domainMap.set(domain, (domainMap.get(domain) ?? 0) + 1);
    }
  }
  const topDomains = Array.from(domainMap.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalSamples,
    durationSeconds,
    avgFaceConfidence: Math.round(avgFaceConfidence * 100) / 100,
    avgActivityScore: Math.round(avgActivityScore * 100) / 100,
    tabComplianceRate: Math.round(tabComplianceRate * 100) / 100,
    alertCount: 0, // Sẽ được tính từ alert-system trong Phase 1
    topDomains,
  };
}
