/**
 * Unit tests cho goal-evaluator.ts
 * Test isGoalCompliant() và isDomainAllowed() theo y_tuong.md
 */

import { describe, it, expect } from 'vitest';
import { isGoalCompliant, isDomainAllowed, extractDomain } from '@/utils/goal-evaluator';
import type { GoalConfig } from '@/utils/types';
import { OUTSIDE_CHROME_MARKER } from '@/utils/types';

describe('isGoalCompliant', () => {
  const baseConfig: GoalConfig = {
    mode: 'study',
    customAllowedDomains: [],
    customExternalRule: null,
  };

  it('should return true for default allowed domains in study mode', () => {
    expect(isGoalCompliant('docs.google.com', baseConfig)).toBe(true);
    expect(isGoalCompliant('drive.google.com', baseConfig)).toBe(true);
    expect(isGoalCompliant('notion.so', baseConfig)).toBe(true);
  });

  it('should return false for non-allowed domains', () => {
    expect(isGoalCompliant('facebook.com', baseConfig)).toBe(false);
    expect(isGoalCompliant('twitter.com', baseConfig)).toBe(false);
  });

  it('should use default external app rule when customExternalRule is null', () => {
    // study mode: default external = true
    expect(isGoalCompliant(OUTSIDE_CHROME_MARKER, baseConfig)).toBe(true);

    // programming mode: default external = false
    const programmingConfig: GoalConfig = {
      mode: 'programming',
      customAllowedDomains: [],
      customExternalRule: null,
    };
    expect(isGoalCompliant(OUTSIDE_CHROME_MARKER, programmingConfig)).toBe(false);
  });

  it('should respect customExternalRule override', () => {
    const config: GoalConfig = {
      mode: 'study',
      customAllowedDomains: [],
      customExternalRule: false, // override default true
    };
    expect(isGoalCompliant(OUTSIDE_CHROME_MARKER, config)).toBe(false);
  });

  it('should include customAllowedDomains in check', () => {
    const config: GoalConfig = {
      mode: 'study',
      customAllowedDomains: ['myapp.com', 'internal.corp.net'],
      customExternalRule: null,
    };
    expect(isGoalCompliant('myapp.com', config)).toBe(true);
    expect(isGoalCompliant('internal.corp.net', config)).toBe(true);
  });

  it('should work with programming mode defaults', () => {
    const config: GoalConfig = {
      mode: 'programming',
      customAllowedDomains: [],
      customExternalRule: null,
    };
    expect(isGoalCompliant('github.com', config)).toBe(true);
    expect(isGoalCompliant('localhost', config)).toBe(true);
    expect(isGoalCompliant('vscode.dev', config)).toBe(true);
    expect(isGoalCompliant('youtube.com', config)).toBe(false);
  });

  it('should work with video-lecture mode defaults', () => {
    const config: GoalConfig = {
      mode: 'video-lecture',
      customAllowedDomains: [],
      customExternalRule: null,
    };
    expect(isGoalCompliant('youtube.com', config)).toBe(true);
    expect(isGoalCompliant('coursera.org', config)).toBe(true);
    expect(isGoalCompliant('github.com', config)).toBe(false);
  });
});

describe('isDomainAllowed', () => {
  const allowedDomains = ['google.com', 'notion.so', 'github.com'];

  it('should return true for exact match', () => {
    expect(isDomainAllowed('https://google.com/path', allowedDomains)).toBe(true);
    expect(isDomainAllowed('https://notion.so/page', allowedDomains)).toBe(true);
  });

  it('should return true for subdomain match', () => {
    expect(isDomainAllowed('https://docs.google.com', allowedDomains)).toBe(true);
    expect(isDomainAllowed('https://drive.google.com', allowedDomains)).toBe(true);
    expect(isDomainAllowed('https://api.github.com/repos', allowedDomains)).toBe(true);
  });

  it('should return false for non-allowed domains', () => {
    expect(isDomainAllowed('https://facebook.com', allowedDomains)).toBe(false);
    expect(isDomainAllowed('https://twitter.com', allowedDomains)).toBe(false);
  });

  it('should return false for empty URL', () => {
    expect(isDomainAllowed('', allowedDomains)).toBe(false);
  });

  it('should return false for invalid URL', () => {
    expect(isDomainAllowed('not-a-url', allowedDomains)).toBe(false);
    expect(isDomainAllowed('chrome://extensions', allowedDomains)).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isDomainAllowed('https://GOOGLE.COM/path', allowedDomains)).toBe(true);
    expect(isDomainAllowed('https://GitHub.Com/repo', allowedDomains)).toBe(true);
  });
});

describe('extractDomain', () => {
  it('should extract domain from valid URL', () => {
    expect(extractDomain('https://docs.google.com/document')).toBe('docs.google.com');
    expect(extractDomain('http://localhost:3000')).toBe('localhost');
  });

  it('should return empty string for invalid input', () => {
    expect(extractDomain('')).toBe('');
    expect(extractDomain('not-a-url')).toBe('');
  });
});
