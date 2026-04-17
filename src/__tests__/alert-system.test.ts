/**
 * Unit tests cho alert-system.ts
 * Test createAlertState(), checkAlerts(), getAlertCount()
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAlertState,
  checkAlerts,
  getAlertCount,
} from '@/utils/alert-system';
import type { AlertState } from '@/utils/alert-system';
import type { GoalConfig } from '@/utils/types';
import { FACE_LOST_THRESHOLD_MS, IDLE_THRESHOLD_MS } from '@/utils/types';

const baseGoalConfig: GoalConfig = {
  mode: 'study',
  customAllowedDomains: [],
  customExternalRule: null,
};

describe('createAlertState', () => {
  it('should create an initial state with empty alerts', () => {
    const state = createAlertState();
    expect(state.activeAlerts.size).toBe(0);
    expect(state.alertHistory).toHaveLength(0);
    expect(state.lastFaceDetectedAt).toBeGreaterThan(0);
    expect(state.lastActivityAt).toBeGreaterThan(0);
  });
});

describe('checkAlerts', () => {
  let state: AlertState;

  beforeEach(() => {
    state = createAlertState();
  });

  it('should return no alerts when everything is fine', () => {
    const alerts = checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: true,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });
    expect(alerts).toHaveLength(0);
  });

  it('should trigger face-lost alert after threshold', () => {
    // Simulate face lost for longer than threshold
    state.lastFaceDetectedAt = Date.now() - FACE_LOST_THRESHOLD_MS - 1000;

    const alerts = checkAlerts(state, {
      faceDetected: false,
      isIdle: false,
      goalCompliant: true,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('face-lost');
    expect(state.activeAlerts.has('face-lost')).toBe(true);
  });

  it('should NOT trigger face-lost when camera is disabled', () => {
    state.lastFaceDetectedAt = Date.now() - FACE_LOST_THRESHOLD_MS - 1000;

    const alerts = checkAlerts(state, {
      faceDetected: false,
      isIdle: false,
      goalCompliant: true,
      isOutsideChrome: false,
      cameraEnabled: false,
      goalConfig: baseGoalConfig,
    });

    expect(alerts).toHaveLength(0);
  });

  it('should clear face-lost alert when face is detected again', () => {
    state.activeAlerts.add('face-lost');

    checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: true,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(state.activeAlerts.has('face-lost')).toBe(false);
  });

  it('should trigger idle alert after threshold', () => {
    state.lastActivityAt = Date.now() - IDLE_THRESHOLD_MS - 1000;

    const alerts = checkAlerts(state, {
      faceDetected: true,
      isIdle: true,
      goalCompliant: true,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('idle');
  });

  it('should clear idle alert when activity resumes', () => {
    state.activeAlerts.add('idle');

    checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: true,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(state.activeAlerts.has('idle')).toBe(false);
  });

  it('should trigger tab-violation when not goal compliant', () => {
    const alerts = checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: false,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('tab-violation');
  });

  it('should NOT duplicate tab-violation alert when already active', () => {
    // Trigger first
    checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: false,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    // Second call should not re-trigger
    const alerts = checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: false,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(alerts).toHaveLength(0);
  });

  it('should trigger outside-chrome alert when applicable', () => {
    const config: GoalConfig = {
      mode: 'programming',
      customAllowedDomains: [],
      customExternalRule: false,
    };

    const alerts = checkAlerts(state, {
      faceDetected: true,
      isIdle: false,
      goalCompliant: false, // outside chrome + not compliant → alert
      isOutsideChrome: true,
      cameraEnabled: true,
      goalConfig: config,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('outside-chrome');
  });

  it('should accumulate alerts in history', () => {
    // Trigger face-lost
    state.lastFaceDetectedAt = Date.now() - FACE_LOST_THRESHOLD_MS - 1000;
    state.lastActivityAt = Date.now() - IDLE_THRESHOLD_MS - 1000;

    checkAlerts(state, {
      faceDetected: false,
      isIdle: true,
      goalCompliant: false,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(state.alertHistory.length).toBeGreaterThanOrEqual(2);
  });
});

describe('getAlertCount', () => {
  it('should return total alert count from history', () => {
    const state = createAlertState();
    expect(getAlertCount(state)).toBe(0);

    // Trigger some alerts
    state.lastFaceDetectedAt = Date.now() - FACE_LOST_THRESHOLD_MS - 1000;
    checkAlerts(state, {
      faceDetected: false,
      isIdle: false,
      goalCompliant: false,
      isOutsideChrome: false,
      cameraEnabled: true,
      goalConfig: baseGoalConfig,
    });

    expect(getAlertCount(state)).toBeGreaterThanOrEqual(1);
  });
});
