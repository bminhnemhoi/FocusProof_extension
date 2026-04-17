/**
 * FocusProof – Goal Evaluator
 * Logic đánh giá mục tiêu phiên làm việc.
 * Reference: y_tuong.md Section 2.1 – Goal-based Evaluation & Multi-Tab Guard
 *
 * Hai hàm chính:
 * - isGoalCompliant(): Kiểm tra trạng thái hiện tại có phù hợp mục tiêu không
 * - isDomainAllowed(): Kiểm tra domain có nằm trong danh sách cho phép không
 */

import type { GoalConfig } from './types';
import {
  DEFAULT_GOAL_DOMAIN_RULES,
  DEFAULT_GOAL_EXTERNAL_APP_RULE,
  OUTSIDE_CHROME_MARKER,
} from './types';

/**
 * Kiểm tra trạng thái hiện tại có phù hợp với mục tiêu phiên không.
 *
 * - Nếu user ở ngoài Chrome → kiểm tra rule external app (custom > default)
 * - Nếu user ở trong Chrome → kiểm tra domain có trong allowed list không
 *
 * @param currentState - URL/domain hiện tại hoặc '__outside_chrome__'
 * @param config - Cấu hình mục tiêu (mode, customAllowedDomains, customExternalRule)
 * @returns true nếu phù hợp mục tiêu
 */
export function isGoalCompliant(currentState: string, config: GoalConfig): boolean {
  // Trường hợp 1: User rời khỏi Chrome
  if (currentState === OUTSIDE_CHROME_MARKER) {
    // Ưu tiên custom rule, fallback về default
    if (config.customExternalRule !== undefined && config.customExternalRule !== null) {
      return config.customExternalRule;
    }
    return DEFAULT_GOAL_EXTERNAL_APP_RULE[config.mode];
  }

  // Trường hợp 2: User đang trong Chrome → kiểm tra domain
  const allAllowed = [
    ...DEFAULT_GOAL_DOMAIN_RULES[config.mode],
    ...config.customAllowedDomains,
  ];

  return allAllowed.some(
    (allowed) => currentState.includes(allowed) || allowed.includes(currentState),
  );
}

/**
 * Kiểm tra domain hiện tại có nằm trong danh sách allowed domains không.
 * Dùng cho Multi-Tab Guard – kiểm tra realtime khi tab thay đổi.
 *
 * Match logic (theo y_tuong.md):
 * - Exact match: hostname === allowed
 * - Subdomain match: hostname ends with '.allowed'
 * - Reverse subdomain: allowed ends with '.hostname'
 *
 * @param currentUrl - URL đầy đủ của tab hiện tại
 * @param allowedDomains - Danh sách domain được phép
 * @returns true nếu domain được phép
 */
export function isDomainAllowed(currentUrl: string, allowedDomains: string[]): boolean {
  if (!currentUrl) return false;

  let hostname: string;
  try {
    hostname = new URL(currentUrl).hostname.toLowerCase();
  } catch {
    // URL không hợp lệ (ví dụ: chrome://, about:blank)
    return false;
  }

  return allowedDomains.some((allowed) => {
    const a = allowed.toLowerCase();
    return hostname === a || hostname.endsWith('.' + a) || a.endsWith('.' + hostname);
  });
}

/**
 * Trích xuất domain từ URL.
 * Trả về hostname hoặc chuỗi rỗng nếu URL không hợp lệ.
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}
