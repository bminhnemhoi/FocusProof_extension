/**
 * FocusProof – Gamification Engine
 * Hệ thống streak và huy hiệu.
 * Reference: y_tuong.md Section 2.2 – Gamification
 *
 * Huy hiệu được kiểm tra **chỉ cuối session** trong finalizeSession().
 * Lưu trữ trong chrome.storage.local key `badges: Record<string, boolean>`.
 */

import type { BadgeDefinition, SessionData } from './types';

/** Tất cả huy hiệu có trong hệ thống */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_session',
    name: 'Bước Đầu Tiên',
    nameEn: 'First Step',
    description: 'Hoàn thành phiên tập trung đầu tiên',
    check: () => true, // Luôn đạt khi hoàn thành session
  },
  {
    id: 'focus_master',
    name: 'Bậc Thầy Tập Trung',
    nameEn: 'Focus Master',
    description: 'Đạt điểm focus ≥ 90',
    check: (session) => (session.finalScore ?? 0) >= 90,
  },
  {
    id: 'perfect_score',
    name: 'Hoàn Hảo',
    nameEn: 'Perfect Score',
    description: 'Đạt điểm focus ≥ 95',
    check: (session) => (session.finalScore ?? 0) >= 95,
  },
  {
    id: 'long_session',
    name: 'Marathon',
    nameEn: 'Marathon',
    description: 'Hoàn thành phiên ≥ 60 phút',
    check: (session) => session.config.durationMinutes >= 60,
  },
  {
    id: 'no_alerts',
    name: 'Không Xao Nhãng',
    nameEn: 'Zero Distractions',
    description: 'Hoàn thành phiên không có alert nào',
    check: (session) => {
      // Kiểm tra tất cả samples đều goalCompliant và không idle
      return session.samples.every((s) => s.goalCompliant && !s.activity.idle);
    },
  },
  {
    id: 'camera_brave',
    name: 'Dũng Cảm',
    nameEn: 'Camera Brave',
    description: 'Hoàn thành phiên với camera bật và điểm ≥ 70',
    check: (session) => session.config.cameraEnabled && (session.finalScore ?? 0) >= 70,
  },
  {
    id: 'night_owl',
    name: 'Cú Đêm',
    nameEn: 'Night Owl',
    description: 'Hoàn thành phiên sau 22:00',
    check: (session) => {
      const hour = new Date(session.startTime).getHours();
      return hour >= 22 || hour < 5;
    },
  },
  {
    id: 'early_bird',
    name: 'Dậy Sớm',
    nameEn: 'Early Bird',
    description: 'Hoàn thành phiên trước 7:00 sáng',
    check: (session) => {
      const hour = new Date(session.startTime).getHours();
      return hour >= 5 && hour < 7;
    },
  },
  {
    id: 'strict_warrior',
    name: 'Chiến Binh Kỷ Luật',
    nameEn: 'Strict Warrior',
    description: 'Hoàn thành phiên Strict Mode với điểm ≥ 80',
    check: (session) => session.config.strictMode && (session.finalScore ?? 0) >= 80,
  },
  {
    id: 'tab_compliant',
    name: 'Đúng Mục Tiêu',
    nameEn: 'On Target',
    description: '100% samples phù hợp mục tiêu',
    check: (session) => {
      if (session.samples.length === 0) return false;
      return session.samples.every((s) => s.goalCompliant);
    },
  },
];

/**
 * Kiểm tra tất cả huy hiệu cho một session.
 * Gọi trong finalizeSession() — chỉ cuối session.
 *
 * @returns Danh sách badge IDs đạt được trong session này
 */
export function checkBadges(session: SessionData): string[] {
  return BADGE_DEFINITIONS
    .filter((badge) => badge.check(session))
    .map((badge) => badge.id);
}

/**
 * Merge badges mới vào record hiện có.
 */
export function mergeBadges(
  existing: Record<string, boolean>,
  newBadgeIds: string[],
): Record<string, boolean> {
  const merged = { ...existing };
  for (const id of newBadgeIds) {
    merged[id] = true;
  }
  return merged;
}
