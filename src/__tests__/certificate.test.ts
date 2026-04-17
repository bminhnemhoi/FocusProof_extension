/**
 * Unit + Integration tests cho certificate.ts
 * Test generateCertificatePDF, downloadCertificate.
 * Mock jsPDF, QRCode, DOM APIs.
 *
 * Bao gồm: test task name có dấu tiếng Việt (per ke_hoach.md).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SessionData, AIAnalysisResult } from '@/utils/types';

// ── Mock qrcode ──
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,MOCK_QR'),
  },
}));

// ── Mock jsPDF ──
const mockDocMethods = {
  setFillColor: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setGState: vi.fn(),
  GState: vi.fn().mockReturnValue({}),
  rect: vi.fn(),
  circle: vi.fn(),
  triangle: vi.fn(),
  line: vi.fn(),
  lines: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  addPage: vi.fn(),
  splitTextToSize: vi.fn().mockImplementation((text: string) => [text]),
  output: vi.fn().mockReturnValue(new Blob(['pdf-content'], { type: 'application/pdf' })),
  context2d: null,
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({ ...mockDocMethods })),
}));

import { generateCertificatePDF, downloadCertificate } from '@/utils/certificate';

// ── Helper: session mẫu ──
function createMockSession(overrides?: Partial<SessionData>): SessionData {
  return {
    id: 'cert-test-001',
    config: {
      taskName: 'Viết báo cáo đồ án',
      mode: 'study',
      allowedDomains: ['docs.google.com', 'notion.so'],
      allowExternalApps: false,
      strictMode: false,
      durationMinutes: 25,
      cameraEnabled: true,
    },
    status: 'finished',
    startTime: new Date('2025-01-15T10:00:00Z').getTime(),
    endTime: new Date('2025-01-15T10:25:00Z').getTime(),
    samples: [
      {
        timestamp: Date.now() - 20 * 60 * 1000,
        face: { detected: true, confidence: 0.92 },
        activity: { keystrokes: 25, clicks: 4, scrolls: 3, idle: false },
        tab: { currentUrl: 'https://docs.google.com', currentDomain: 'docs.google.com', isAllowed: true, isOutsideChrome: false },
        focusScore: 0.88,
        goalCompliant: true,
      },
      {
        timestamp: Date.now() - 10 * 60 * 1000,
        face: { detected: true, confidence: 0.85 },
        activity: { keystrokes: 18, clicks: 2, scrolls: 1, idle: false },
        tab: { currentUrl: 'https://notion.so', currentDomain: 'notion.so', isAllowed: true, isOutsideChrome: false },
        focusScore: 0.82,
        goalCompliant: true,
      },
    ],
    finalScore: 85,
    hash: 'abc123def456789abcdef',
    badges: ['focused-start'],
    ...overrides,
  };
}

const mockAIResult: AIAnalysisResult = {
  summaryVi: 'Phiên tập trung tốt với điểm 85/100.',
  summaryEn: 'Good focus session with score 85/100.',
  recommendations: ['Tránh mở tab không liên quan', 'Nghỉ giải lao mỗi 25 phút'],
  focusPattern: 'Ổn định trong suốt phiên',
};

describe('generateCertificatePDF', () => {
  it('should return a Blob', async () => {
    const session = createMockSession();
    const result = await generateCertificatePDF(session);

    expect(result).toBeInstanceOf(Blob);
  });

  it('should create A4 landscape PDF', async () => {
    const { jsPDF } = await import('jspdf');
    const session = createMockSession();
    await generateCertificatePDF(session);

    expect(jsPDF).toHaveBeenCalledWith({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
  });

  it('should add second page for AI analysis', async () => {
    const session = createMockSession();
    await generateCertificatePDF(session);

    // addPage should be called for page 2
    expect(mockDocMethods.addPage).toHaveBeenCalledWith('a4', 'landscape');
  });

  it('should render without AI analysis (page 2 shows "not performed")', async () => {
    const session = createMockSession();
    await generateCertificatePDF(session, undefined);

    // Should still generate PDF without error
    expect(mockDocMethods.output).toHaveBeenCalledWith('blob');
    // Page 2 should contain "AI Analysis was not performed" text
    const textCalls = mockDocMethods.text.mock.calls;
    const texts = textCalls.map((c: unknown[]) => c[0]);
    expect(texts.some((t: unknown) => typeof t === 'string' && t.includes('AI Analysis was not performed'))).toBe(true);
  });

  it('should render with AI analysis data', async () => {
    const session = createMockSession();
    await generateCertificatePDF(session, mockAIResult);

    const textCalls = mockDocMethods.text.mock.calls;
    const texts = textCalls.map((c: unknown[]) => c[0]).flat();
    // Should contain summary headers
    expect(texts.some((t: unknown) => typeof t === 'string' && (t.includes('Tóm tắt') || t.includes('Tom tat')))).toBe(true);
    expect(texts.some((t: unknown) => typeof t === 'string' && t.includes('Summary (English)'))).toBe(true);
  });

  it('should handle task name with Vietnamese diacritics', async () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        taskName: 'Đọc tài liệu kỹ thuật phần mềm nâng cao',
      },
    });

    // Should not throw
    const result = await generateCertificatePDF(session);
    expect(result).toBeInstanceOf(Blob);

    // Task name should appear in text calls
    const textCalls = mockDocMethods.text.mock.calls;
    const texts = textCalls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('Đọc tài liệu kỹ thuật phần mềm nâng cao');
  });

  it('should handle task name with special characters', async () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        taskName: 'Bài tập C++ & Thuật toán (nâng cao)',
      },
    });

    const result = await generateCertificatePDF(session);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should include QR code image', async () => {
    const session = createMockSession();
    await generateCertificatePDF(session);

    expect(mockDocMethods.addImage).toHaveBeenCalled();
    const imageCall = mockDocMethods.addImage.mock.calls[0];
    expect(imageCall[0]).toContain('data:image/png;base64');
    expect(imageCall[1]).toBe('PNG');
  });

  it('should include SHA-256 hash in footer', async () => {
    const session = createMockSession();
    await generateCertificatePDF(session);

    const textCalls = mockDocMethods.text.mock.calls;
    const hashTexts = textCalls.filter((c: unknown[]) =>
      typeof c[0] === 'string' && c[0].includes('SHA-256:'),
    );
    expect(hashTexts.length).toBeGreaterThan(0);
  });

  it('should handle session without hash', async () => {
    const session = createMockSession({ hash: undefined });
    const result = await generateCertificatePDF(session);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should handle session without endTime', async () => {
    const session = createMockSession({ endTime: undefined });
    const result = await generateCertificatePDF(session);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should render score in the score circle', async () => {
    const session = createMockSession({ finalScore: 92 });
    await generateCertificatePDF(session);

    const textCalls = mockDocMethods.text.mock.calls;
    const scoreTexts = textCalls.filter((c: unknown[]) => c[0] === '92');
    expect(scoreTexts.length).toBeGreaterThan(0);
  });

  it('should render signal breakdown bars', async () => {
    const session = createMockSession();
    await generateCertificatePDF(session);

    const textCalls = mockDocMethods.text.mock.calls;
    const texts = textCalls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('Signal Breakdown');
    expect(texts).toContain('Face Confidence');
    expect(texts).toContain('Activity');
    expect(texts).toContain('Tab Compliance');
  });
});

describe('downloadCertificate', () => {
  let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    mockAnchor = { href: '', download: '', click: vi.fn() };

    // jsdom doesn't have URL.createObjectURL / revokeObjectURL
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      URL.revokeObjectURL = vi.fn();
      cleanups.push(() => {
        delete (URL as unknown as Record<string, unknown>).createObjectURL;
        delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockAnchor as unknown as HTMLElement;
      return origCreateElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
    // Don't use vi.restoreAllMocks() — it would wipe the jsPDF module mock.
    // Just restore the DOM spies manually.
    vi.mocked(document.createElement).mockRestore();
    vi.mocked(document.body.appendChild).mockRestore();
    vi.mocked(document.body.removeChild).mockRestore();
  });

  it('should trigger download with correct filename', async () => {
    const session = createMockSession();
    await downloadCertificate(session);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(mockAnchor.download).toMatch(/^FocusProof_.*\.pdf$/);
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });

  it('should sanitize task name in filename', async () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        taskName: 'Đọc sách/viết bài',
      },
    });
    await downloadCertificate(session);

    // Non-alphanumeric chars should be replaced with _
    expect(mockAnchor.download).not.toContain('/');
    expect(mockAnchor.download).toContain('FocusProof_');
  });

  it('should revoke object URL after download', async () => {
    const session = createMockSession();
    await downloadCertificate(session);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should clean up DOM after download', async () => {
    const session = createMockSession();
    await downloadCertificate(session);

    expect(document.body.appendChild).toHaveBeenCalledOnce();
    expect(document.body.removeChild).toHaveBeenCalledOnce();
  });

  it('should pass aiAnalysis to PDF generator when provided', async () => {
    const session = createMockSession();
    // Should not throw
    await downloadCertificate(session, mockAIResult);
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });
});

// ============================================================
// Integration: Full flow Session → QR → PDF
// ============================================================

describe('Integration: Certificate generation flow', () => {
  it('should generate complete 2-page PDF from session with AI analysis', async () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        taskName: 'Lập trình ứng dụng React nâng cao',
        strictMode: true,
      },
      finalScore: 91,
    });

    const aiResult: AIAnalysisResult = {
      summaryVi: 'Phiên lập trình rất hiệu quả với điểm 91.',
      summaryEn: 'Very effective programming session with score 91.',
      recommendations: [
        'Tiếp tục duy trì nhịp độ',
        'Sử dụng pomodoro technique',
        'Tắt notification khi code',
      ],
      focusPattern: 'Tập trung cao, ổn định',
    };

    const blob = await generateCertificatePDF(session, aiResult);

    // Should produce a valid Blob
    expect(blob).toBeInstanceOf(Blob);

    // Should have called addPage for page 2
    expect(mockDocMethods.addPage).toHaveBeenCalled();

    // Should have rendered task name
    const textCalls = mockDocMethods.text.mock.calls;
    const texts = textCalls.map((c: unknown[]) => c[0]);
    expect(texts).toContain('Lập trình ứng dụng React nâng cao');
  });

  it('should generate PDF for session without camera', async () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        cameraEnabled: false,
      },
    });

    const blob = await generateCertificatePDF(session);
    expect(blob).toBeInstanceOf(Blob);

    const textCalls = mockDocMethods.text.mock.calls;
    const cameraValues = textCalls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && c[0] === 'OFF',
    );
    expect(cameraValues.length).toBeGreaterThan(0);
  });

  it('should handle empty allowedDomains', async () => {
    const session = createMockSession({
      config: {
        ...createMockSession().config,
        allowedDomains: [],
      },
    });

    const blob = await generateCertificatePDF(session);
    expect(blob).toBeInstanceOf(Blob);
  });
});
