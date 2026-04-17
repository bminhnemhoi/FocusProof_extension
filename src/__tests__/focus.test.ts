/**
 * Unit tests cho focus.ts
 * Test thuật toán tính điểm, grade, session stats
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeFace,
  normalizeActivity,
  normalizeTab,
  calculateSampleScore,
  calculateFinalScore,
  getGrade,
} from '@/utils/focus';
import type { FaceResult, ActivityResult, Sample } from '@/utils/types';

describe('normalizeFace', () => {
  it('should return 0 when face not detected', () => {
    expect(normalizeFace({ detected: false, confidence: 0 })).toBe(0);
    expect(normalizeFace({ detected: false, confidence: 0.9 })).toBe(0);
  });

  it('should return confidence when face detected', () => {
    expect(normalizeFace({ detected: true, confidence: 0.85 })).toBe(0.85);
    expect(normalizeFace({ detected: true, confidence: 1.0 })).toBe(1.0);
  });

  it('should clamp to 0–1 range', () => {
    expect(normalizeFace({ detected: true, confidence: 1.5 })).toBe(1);
    expect(normalizeFace({ detected: true, confidence: -0.2 })).toBe(0);
  });
});

describe('normalizeActivity', () => {
  it('should return 0 when idle', () => {
    expect(normalizeActivity({ keystrokes: 10, clicks: 5, scrolls: 3, idle: true })).toBe(0);
  });

  it('should return > 0 when active', () => {
    const result = normalizeActivity({ keystrokes: 15, clicks: 3, scrolls: 2, idle: false });
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('should cap at 1.0 for very high activity', () => {
    const result = normalizeActivity({ keystrokes: 100, clicks: 50, scrolls: 50, idle: false });
    expect(result).toBeLessThanOrEqual(1);
  });

  it('should weight keystrokes highest', () => {
    const keysOnly = normalizeActivity({ keystrokes: 20, clicks: 0, scrolls: 0, idle: false });
    const clicksOnly = normalizeActivity({ keystrokes: 0, clicks: 20, scrolls: 0, idle: false });
    expect(keysOnly).toBeGreaterThan(clicksOnly);
  });
});

describe('normalizeTab', () => {
  it('should return 1.0 when goal compliant', () => {
    expect(normalizeTab(true)).toBe(1.0);
  });

  it('should return 0.0 when not goal compliant', () => {
    expect(normalizeTab(false)).toBe(0.0);
  });
});

describe('calculateSampleScore', () => {
  const faceDetected: FaceResult = { detected: true, confidence: 0.9 };
  const faceNone: FaceResult = { detected: false, confidence: 0 };
  const activeActivity: ActivityResult = { keystrokes: 20, clicks: 3, scrolls: 2, idle: false };
  const idleActivity: ActivityResult = { keystrokes: 0, clicks: 0, scrolls: 0, idle: true };

  it('should use camera-on weights when camera enabled', () => {
    const score = calculateSampleScore(faceDetected, activeActivity, true, true);
    // Face(40%) + Activity(35%) + Tab(25%) – all contributions positive
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should use camera-off weights when camera disabled', () => {
    const score = calculateSampleScore(faceNone, activeActivity, true, false);
    // Activity(60%) + Tab(40%) – no face contribution
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should return 0 when all signals are zero (idle, no face, tab violation)', () => {
    const score = calculateSampleScore(faceNone, idleActivity, false, true);
    expect(score).toBe(0);
  });

  it('should return max when all signals are perfect', () => {
    const perfectFace: FaceResult = { detected: true, confidence: 1.0 };
    const perfectActivity: ActivityResult = { keystrokes: 30, clicks: 6, scrolls: 10, idle: false };
    const score = calculateSampleScore(perfectFace, perfectActivity, true, true);
    expect(score).toBeCloseTo(1.0, 1);
  });
});

describe('calculateFinalScore', () => {
  it('should return 0 for empty samples', () => {
    expect(calculateFinalScore([])).toBe(0);
  });

  it('should calculate correct average', () => {
    const samples: Sample[] = [
      makeSample(0.8),
      makeSample(0.6),
      makeSample(0.7),
    ];
    // avg = 0.7 → 70.0
    expect(calculateFinalScore(samples)).toBe(70);
  });
});

describe('getGrade', () => {
  it('should return S for score >= 95', () => {
    expect(getGrade(95).grade).toBe('S');
    expect(getGrade(100).grade).toBe('S');
  });

  it('should return A for score 85–94', () => {
    expect(getGrade(85).grade).toBe('A');
    expect(getGrade(94).grade).toBe('A');
  });

  it('should return B for score 70–84', () => {
    expect(getGrade(70).grade).toBe('B');
    expect(getGrade(84).grade).toBe('B');
  });

  it('should return C for score 55–69', () => {
    expect(getGrade(55).grade).toBe('C');
  });

  it('should return D for score 40–54', () => {
    expect(getGrade(40).grade).toBe('D');
  });

  it('should return F for score < 40', () => {
    expect(getGrade(39).grade).toBe('F');
    expect(getGrade(0).grade).toBe('F');
  });
});

// Helper
function makeSample(focusScore: number): Sample {
  return {
    timestamp: Date.now(),
    face: { detected: true, confidence: 0.9 },
    activity: { keystrokes: 10, clicks: 2, scrolls: 1, idle: false },
    tab: { currentUrl: 'https://docs.google.com', currentDomain: 'docs.google.com', isAllowed: true, isOutsideChrome: false },
    focusScore,
    goalCompliant: true,
  };
}
