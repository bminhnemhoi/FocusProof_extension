/**
 * Unit tests cho certificate-signing.ts
 * Kiểm tra integrity fingerprint + tự xác thực chống chỉnh sửa dữ liệu.
 */

import { describe, it, expect } from 'vitest';
import {
  computeIntegrityHash,
  verifyIntegrity,
  buildCanonicalPayload,
} from '@/utils/certificate-signing';
import type { SessionData } from '@/utils/types';

function makeSession(overrides?: Partial<SessionData>): SessionData {
  return {
    id: 'fp_sign_test',
    config: {
      taskName: 'Ôn tập',
      mode: 'study',
      allowedDomains: [],
      allowExternalApps: true,
      strictMode: false,
      durationMinutes: 25,
      cameraEnabled: false,
    },
    status: 'finished',
    startTime: 1_700_000_000_000,
    endTime: 1_700_000_060_000,
    samples: [],
    finalScore: 82,
    badges: [],
    ...overrides,
  };
}

describe('computeIntegrityHash', () => {
  it('should produce a 64-char hex SHA-256 string', async () => {
    const hash = await computeIntegrityHash(makeSession());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should be deterministic for identical data', async () => {
    const a = await computeIntegrityHash(makeSession());
    const b = await computeIntegrityHash(makeSession());
    expect(a).toBe(b);
  });

  it('should change when a certificate field changes (tamper-evident)', async () => {
    const base = await computeIntegrityHash(makeSession({ finalScore: 82 }));
    const tampered = await computeIntegrityHash(makeSession({ finalScore: 99 }));
    expect(tampered).not.toBe(base);
  });
});

describe('verifyIntegrity', () => {
  it('should validate a session whose stored hash matches its data', async () => {
    const session = makeSession();
    session.hash = await computeIntegrityHash(session);
    const check = await verifyIntegrity(session);
    expect(check.valid).toBe(true);
  });

  it('should reject a session whose score was edited after signing', async () => {
    const session = makeSession({ finalScore: 82 });
    session.hash = await computeIntegrityHash(session);
    session.finalScore = 100; // giả lập chỉnh sửa gian lận
    const check = await verifyIntegrity(session);
    expect(check.valid).toBe(false);
  });

  it('should reject a session with no stored hash', async () => {
    const check = await verifyIntegrity(makeSession({ hash: undefined }));
    expect(check.valid).toBe(false);
  });
});

describe('buildCanonicalPayload', () => {
  it('should include the key certificate fields', () => {
    const payload = JSON.parse(buildCanonicalPayload(makeSession()));
    expect(payload).toMatchObject({
      id: 'fp_sign_test',
      finalScore: 82,
      taskName: 'Ôn tập',
    });
  });
});
