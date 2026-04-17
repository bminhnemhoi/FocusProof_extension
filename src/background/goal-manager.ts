/**
 * FocusProof – Goal Manager
 * Cầu nối giữa SessionConfig và hệ thống Goal Evaluation.
 * Chuyển đổi TabState → TabResult với đánh giá goal compliance.
 *
 * Wrap các pure functions từ utils/goal-evaluator.ts
 * để dùng trong background context.
 */

import type { SessionConfig, GoalConfig, TabResult } from '@/utils/types';
import { OUTSIDE_CHROME_MARKER } from '@/utils/types';
import { isGoalCompliant, extractDomain } from '@/utils/goal-evaluator';
import type { TabState } from './tab-tracker';

/**
 * Chuyển SessionConfig thành GoalConfig cho evaluation.
 */
export function buildGoalConfig(config: SessionConfig): GoalConfig {
  return {
    mode: config.mode,
    customAllowedDomains: config.allowedDomains,
    customExternalRule: config.allowExternalApps,
  };
}

/**
 * Chuyển TabState + GoalConfig thành TabResult có đánh giá compliance.
 */
export function buildTabResult(tabState: TabState, goalConfig: GoalConfig): TabResult {
  if (tabState.isOutsideChrome) {
    return {
      currentUrl: OUTSIDE_CHROME_MARKER,
      currentDomain: OUTSIDE_CHROME_MARKER,
      isAllowed: isGoalCompliant(OUTSIDE_CHROME_MARKER, goalConfig),
      isOutsideChrome: true,
    };
  }

  const domain = extractDomain(tabState.url);
  return {
    currentUrl: tabState.url,
    currentDomain: domain,
    isAllowed: isGoalCompliant(domain || tabState.url, goalConfig),
    isOutsideChrome: false,
  };
}
