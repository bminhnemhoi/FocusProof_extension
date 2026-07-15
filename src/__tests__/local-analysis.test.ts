/**
 * Unit tests cho local-analysis.ts (engine phân tích offline).
 * Đảm bảo luôn sinh kết quả hợp lệ, deterministic, không phụ thuộc mạng.
 */

import { describe, it, expect } from 'vitest';
import { generateLocalAnalysis } from '@/utils/local-analysis';
import type { SessionData, Sample, AlertEvent } from '@/utils/types';

function sample(compliant: boolean, idle = false): Sample {
  return {
    timestamp: 1_000,
    face: { detected: true, confidence: 0.85 },
    activity: { keystrokes: idle ? 0 : 18, clicks: 2, scrolls: 1, idle },
    tab: {
      currentUrl: 'https://docs.google.com',
      currentDomain: 'docs.google.com',
      isAllowed: compliant,
      isOutsideChrome: false,
    },
    focusScore: compliant ? 0.85 : 0.2,
    goalCompliant: compliant,
  };
}

function session(overrides?: Partial<SessionData>): SessionData {
  return {
    id: 'fp_local_test',
    config: {
      taskName: 'Ôn thi Toán',
      mode: 'study',
      allowedDomains: ['docs.google.com'],
      allowExternalApps: true,
      strictMode: false,
      durationMinutes: 25,
      cameraEnabled: true,
    },
    status: 'finished',
    startTime: 1_000_000,
    endTime: 1_000_000 + 25 * 60_000,
    samples: [sample(true), sample(true), sample(true)],
    alerts: [],
    finalScore: 88,
    badges: [],
    ...overrides,
  };
}

describe('generateLocalAnalysis', () => {
  it('should always return all required fields with content', () => {
    const r = generateLocalAnalysis(session());
    expect(r.summaryVi.length).toBeGreaterThan(10);
    expect(r.summaryEn.length).toBeGreaterThan(10);
    expect(r.recommendations.length).toBe(3);
    expect(r.focusPattern.length).toBeGreaterThan(0);
  });

  it('should be deterministic (same input → same output)', () => {
    const s = session();
    expect(generateLocalAnalysis(s)).toEqual(generateLocalAnalysis(s));
  });

  it('should reflect the score and task name in the Vietnamese summary', () => {
    const r = generateLocalAnalysis(session({ finalScore: 88 }));
    expect(r.summaryVi).toContain('88');
    expect(r.summaryVi).toContain('Ôn thi Toán');
  });

  it('should surface distraction advice when there were alerts', () => {
    const alerts: AlertEvent[] = [
      { type: 'idle', timestamp: 1, message: 'idle' },
      { type: 'tab-violation', timestamp: 2, message: 'tab' },
      { type: 'tab-violation', timestamp: 3, message: 'tab' },
    ];
    const r = generateLocalAnalysis(
      session({
        alerts,
        finalScore: 45,
        samples: [sample(false), sample(true, true), sample(false)],
      }),
    );
    expect(r.summaryEn).toContain('3 alert');
    expect(r.recommendations.join(' ')).toMatch(/xao nhãng|Strict|gián đoạn/i);
  });

  it('should not crash on an empty session', () => {
    const r = generateLocalAnalysis(session({ samples: [], finalScore: 0, alerts: [] }));
    expect(r.summaryVi).toBeTruthy();
    expect(r.recommendations.length).toBe(3);
  });
});
