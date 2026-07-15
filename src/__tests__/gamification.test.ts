/**
 * Unit tests cho gamification.ts
 * Test checkBadges() và mergeBadges()
 */

import { describe, it, expect } from 'vitest';
import { checkBadges, mergeBadges, BADGE_DEFINITIONS } from '@/utils/gamification';
import type { SessionData } from '@/utils/types';

function createMockSession(overrides: Partial<SessionData> = {}): SessionData {
  return {
    id: 'fp_test_123',
    config: {
      taskName: 'Test Session',
      mode: 'study',
      allowedDomains: ['docs.google.com'],
      allowExternalApps: true,
      strictMode: false,
      durationMinutes: 25,
      cameraEnabled: true,
    },
    status: 'finished',
    startTime: Date.now() - 25 * 60 * 1000,
    endTime: Date.now(),
    samples: [],
    badges: [],
    finalScore: 75,
    ...overrides,
  };
}

function createSampleData(goalCompliant: boolean, idle: boolean) {
  return {
    timestamp: Date.now(),
    face: { detected: true, confidence: 0.9 },
    activity: { keystrokes: 10, clicks: 2, scrolls: 3, idle },
    tab: {
      currentUrl: 'https://docs.google.com',
      currentDomain: 'docs.google.com',
      isAllowed: goalCompliant,
      isOutsideChrome: false,
    },
    focusScore: goalCompliant ? 0.85 : 0.3,
    goalCompliant,
  };
}

describe('BADGE_DEFINITIONS', () => {
  it('should have 10 badges defined', () => {
    expect(BADGE_DEFINITIONS).toHaveLength(10);
  });

  it('should have unique IDs', () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('checkBadges', () => {
  it('should always award first_session badge', () => {
    const session = createMockSession();
    const badges = checkBadges(session);
    expect(badges).toContain('first_session');
  });

  it('should award focus_master for score >= 90', () => {
    const session = createMockSession({ finalScore: 92 });
    const badges = checkBadges(session);
    expect(badges).toContain('focus_master');
  });

  it('should NOT award focus_master for score < 90', () => {
    const session = createMockSession({ finalScore: 85 });
    const badges = checkBadges(session);
    expect(badges).not.toContain('focus_master');
  });

  it('should award perfect_score for score >= 95', () => {
    const session = createMockSession({ finalScore: 96 });
    const badges = checkBadges(session);
    expect(badges).toContain('perfect_score');
    expect(badges).toContain('focus_master'); // should also get focus_master
  });

  it('should award long_session for >= 60 minutes of ACTUAL runtime', () => {
    const start = Date.now();
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        durationMinutes: 60,
      },
      // Badge xét thời gian THỰC (endTime - startTime), không phải config
      startTime: start,
      endTime: start + 60 * 60 * 1000,
    });
    const badges = checkBadges(session);
    expect(badges).toContain('long_session');
  });

  it('should NOT award long_session when a 90-minute config was stopped early', () => {
    const start = Date.now();
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        durationMinutes: 90,
      },
      // Cấu hình 90' nhưng dừng ở phút thứ 5 → không được Marathon
      startTime: start,
      endTime: start + 5 * 60 * 1000,
    });
    const badges = checkBadges(session);
    expect(badges).not.toContain('long_session');
  });

  it('should NOT award long_session for < 60 minutes', () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        durationMinutes: 25,
      },
    });
    const badges = checkBadges(session);
    expect(badges).not.toContain('long_session');
  });

  it('should award no_alerts when all samples are compliant and active', () => {
    const samples = Array.from({ length: 10 }, () =>
      createSampleData(true, false),
    );
    const session = createMockSession({ samples });
    const badges = checkBadges(session);
    expect(badges).toContain('no_alerts');
  });

  it('should NOT award no_alerts when some samples are idle', () => {
    const samples = [
      createSampleData(true, false),
      createSampleData(true, true), // idle
      createSampleData(true, false),
    ];
    const session = createMockSession({ samples });
    const badges = checkBadges(session);
    expect(badges).not.toContain('no_alerts');
  });

  it('should award camera_brave for camera on + score >= 70', () => {
    const session = createMockSession({
      config: { ...createMockSession().config, cameraEnabled: true },
      finalScore: 75,
    });
    const badges = checkBadges(session);
    expect(badges).toContain('camera_brave');
  });

  it('should NOT award camera_brave when camera is off', () => {
    const session = createMockSession({
      config: { ...createMockSession().config, cameraEnabled: false },
      finalScore: 80,
    });
    const badges = checkBadges(session);
    expect(badges).not.toContain('camera_brave');
  });

  it('should award night_owl for sessions after 22:00', () => {
    const lateNight = new Date();
    lateNight.setHours(23, 0, 0, 0);
    const session = createMockSession({ startTime: lateNight.getTime() });
    const badges = checkBadges(session);
    expect(badges).toContain('night_owl');
  });

  it('should award early_bird for sessions between 5:00-7:00', () => {
    const earlyMorning = new Date();
    earlyMorning.setHours(6, 0, 0, 0);
    const session = createMockSession({ startTime: earlyMorning.getTime() });
    const badges = checkBadges(session);
    expect(badges).toContain('early_bird');
  });

  it('should award strict_warrior for strict mode + score >= 80', () => {
    const session = createMockSession({
      config: { ...createMockSession().config, strictMode: true },
      finalScore: 85,
    });
    const badges = checkBadges(session);
    expect(badges).toContain('strict_warrior');
  });

  it('should award tab_compliant for 100% goal-compliant samples', () => {
    const samples = Array.from({ length: 5 }, () =>
      createSampleData(true, false),
    );
    const session = createMockSession({ samples });
    const badges = checkBadges(session);
    expect(badges).toContain('tab_compliant');
  });

  it('should NOT award tab_compliant when some samples are non-compliant', () => {
    const samples = [
      createSampleData(true, false),
      createSampleData(false, false), // non-compliant
      createSampleData(true, false),
    ];
    const session = createMockSession({ samples });
    const badges = checkBadges(session);
    expect(badges).not.toContain('tab_compliant');
  });

  it('should NOT award tab_compliant for empty samples', () => {
    const session = createMockSession({ samples: [] });
    const badges = checkBadges(session);
    expect(badges).not.toContain('tab_compliant');
  });
});

describe('mergeBadges', () => {
  it('should merge new badges into existing record', () => {
    const existing = { first_session: true };
    const newIds = ['focus_master', 'camera_brave'];
    const merged = mergeBadges(existing, newIds);

    expect(merged).toEqual({
      first_session: true,
      focus_master: true,
      camera_brave: true,
    });
  });

  it('should not overwrite existing badges', () => {
    const existing = { first_session: true, focus_master: true };
    const newIds = ['focus_master']; // duplicate
    const merged = mergeBadges(existing, newIds);

    expect(merged).toEqual({
      first_session: true,
      focus_master: true,
    });
  });

  it('should handle empty existing and empty new', () => {
    expect(mergeBadges({}, [])).toEqual({});
  });
});
