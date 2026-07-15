/**
 * Unit tests cho qr-code.ts
 * Test buildQRPayload, generateQRDataUrl (mock QRCode library).
 */

import { describe, it, expect, vi } from 'vitest';
import { buildQRPayload, generateQRDataUrl } from '@/utils/qr-code';
import type { SessionData } from '@/utils/types';

// ── Mock qrcode library ──
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,MOCK_QR_DATA'),
  },
}));

import QRCode from 'qrcode';
const mockedToDataURL = vi.mocked(QRCode.toDataURL);

// ── Helper ──
function createMockSession(overrides?: Partial<SessionData>): SessionData {
  return {
    id: 'session-qr-test-001',
    config: {
      taskName: 'Viết báo cáo đồ án tốt nghiệp',
      mode: 'study',
      allowedDomains: ['docs.google.com'],
      allowExternalApps: false,
      strictMode: false,
      durationMinutes: 25,
      cameraEnabled: true,
    },
    status: 'finished',
    startTime: new Date('2025-01-15T10:00:00Z').getTime(),
    endTime: new Date('2025-01-15T10:25:00Z').getTime(),
    samples: [],
    finalScore: 85,
    hash: 'sha256-abc123def456',
    badges: [],
    ...overrides,
  };
}

describe('buildQRPayload', () => {
  it('should build correct payload from session', () => {
    const session = createMockSession();
    const payload = buildQRPayload(session);

    expect(payload.id).toBe('session-qr-test-001');
    expect(payload.hash).toBe('sha256-abc123def456');
    expect(payload.score).toBe(85);
    expect(payload.grade).toBe('A');
    expect(payload.date).toBe('2025-01-15');
    expect(payload.task).toBe('Viết báo cáo đồ án tốt nghiệp');
  });

  it('should default score to 0 when finalScore is undefined', () => {
    const session = createMockSession({ finalScore: undefined });
    const payload = buildQRPayload(session);

    expect(payload.score).toBe(0);
  });

  it('should default hash to empty string when undefined', () => {
    const session = createMockSession({ hash: undefined });
    const payload = buildQRPayload(session);

    expect(payload.hash).toBe('');
  });

  it('should truncate long task names to 50 characters', () => {
    const longName = 'A'.repeat(100);
    const session = createMockSession({
      config: { ...createMockSession().config, taskName: longName },
    });
    const payload = buildQRPayload(session);

    expect(payload.task).toHaveLength(50);
  });

  it('should handle task name with Vietnamese diacritics', () => {
    const session = createMockSession({
      config: { ...createMockSession().config, taskName: 'Đọc sách kỹ thuật phần mềm' },
    });
    const payload = buildQRPayload(session);

    expect(payload.task).toBe('Đọc sách kỹ thuật phần mềm');
  });

  it('should round score to integer', () => {
    const session = createMockSession({ finalScore: 72.7 });
    const payload = buildQRPayload(session);

    expect(payload.score).toBe(73);
    expect(Number.isInteger(payload.score)).toBe(true);
  });

  it('should format date as ISO YYYY-MM-DD', () => {
    const session = createMockSession({
      startTime: new Date('2025-06-30T23:59:59Z').getTime(),
    });
    const payload = buildQRPayload(session);

    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return correct grade for different score ranges', () => {
    const testCases = [
      { score: 95, expectedGrade: 'S' },
      { score: 85, expectedGrade: 'A' },
      { score: 70, expectedGrade: 'B' },
      { score: 55, expectedGrade: 'C' },
      { score: 40, expectedGrade: 'D' },
      { score: 30, expectedGrade: 'F' },
    ];

    for (const { score, expectedGrade } of testCases) {
      const session = createMockSession({ finalScore: score });
      const payload = buildQRPayload(session);
      expect(payload.grade).toBe(expectedGrade);
    }
  });
});

describe('generateQRDataUrl', () => {
  it('should return a data URL string', async () => {
    const session = createMockSession();
    const result = await generateQRDataUrl(session);

    expect(result).toBe('data:image/png;base64,MOCK_QR_DATA');
  });

  it('should call QRCode.toDataURL with correct JSON payload (no verify backend)', async () => {
    // Cô lập khỏi .env thật: không có backend verify → QR chứa JSON tự chứng thực
    vi.stubEnv('VITE_VERIFY_BASE_URL', '');
    try {
      mockedToDataURL.mockClear();
      const session = createMockSession();
      await generateQRDataUrl(session);

      expect(mockedToDataURL).toHaveBeenCalledOnce();
      const [jsonStr, opts] = mockedToDataURL.mock.calls[0];

      // Verify JSON payload
      const parsed = JSON.parse(jsonStr as string);
      expect(parsed.id).toBe('session-qr-test-001');
      expect(parsed.score).toBe(85);

      // Verify QR options
      expect(opts).toMatchObject({
        width: 200,
        margin: 1,
        color: { dark: '#1e293b', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('should embed verify URL when backend is configured', async () => {
    // Có backend verify → QR chứa URL xác thực thật thay vì JSON
    vi.stubEnv('VITE_VERIFY_BASE_URL', 'https://api.focusproof.example');
    try {
      mockedToDataURL.mockClear();
      const session = createMockSession();
      await generateQRDataUrl(session);

      const [content] = mockedToDataURL.mock.calls[0];
      expect(content).toContain('https://api.focusproof.example/verify/');
      expect(content).toContain(encodeURIComponent('session-qr-test-001'));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('should propagate QRCode library errors', async () => {
    mockedToDataURL.mockRejectedValueOnce(new Error('QR generation failed'));
    const session = createMockSession();

    await expect(generateQRDataUrl(session)).rejects.toThrow('QR generation failed');
  });
});
