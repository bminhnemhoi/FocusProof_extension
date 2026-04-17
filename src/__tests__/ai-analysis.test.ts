/**
 * Unit tests cho ai-analysis.ts
 * Test buildAnalysisInput, analyzeSession (mock fetch + getApiKey),
 * và parseAIResponse (indirectly, qua analyzeSession).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildAnalysisInput, analyzeSession } from '@/utils/ai-analysis';
import type { SessionData } from '@/utils/types';

// ── Mock dependencies ──
vi.mock('@/utils/api-key', () => ({
  getApiKey: vi.fn(),
}));

import { getApiKey } from '@/utils/api-key';
const mockedGetApiKey = vi.mocked(getApiKey);

// ── Helper: tạo session mẫu ──
function createMockSession(overrides?: Partial<SessionData>): SessionData {
  return {
    id: 'test-session-001',
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
    startTime: Date.now() - 25 * 60 * 1000,
    endTime: Date.now(),
    samples: [
      {
        timestamp: Date.now() - 20 * 60 * 1000,
        face: { detected: true, confidence: 0.9 },
        activity: { keystrokes: 20, clicks: 3, scrolls: 2, idle: false },
        tab: { currentUrl: 'https://docs.google.com', currentDomain: 'docs.google.com', isAllowed: true, isOutsideChrome: false },
        focusScore: 0.85,
        goalCompliant: true,
      },
      {
        timestamp: Date.now() - 14 * 60 * 1000,
        face: { detected: true, confidence: 0.8 },
        activity: { keystrokes: 15, clicks: 5, scrolls: 1, idle: false },
        tab: { currentUrl: 'https://notion.so', currentDomain: 'notion.so', isAllowed: true, isOutsideChrome: false },
        focusScore: 0.78,
        goalCompliant: true,
      },
      {
        timestamp: Date.now() - 8 * 60 * 1000,
        face: { detected: false, confidence: 0 },
        activity: { keystrokes: 0, clicks: 0, scrolls: 0, idle: true },
        tab: { currentUrl: 'https://youtube.com', currentDomain: 'youtube.com', isAllowed: false, isOutsideChrome: false },
        focusScore: 0.1,
        goalCompliant: false,
      },
    ],
    finalScore: 72,
    hash: 'abc123def456',
    badges: ['focused-start'],
    ...overrides,
  };
}

// ── Fake GPT response ──
const VALID_AI_RESPONSE = JSON.stringify({
  summaryVi: 'Phiên tập trung tốt, có sụt giảm cuối.',
  summaryEn: 'Good focus session with decline towards the end.',
  recommendations: ['Tránh mở YouTube', 'Nghỉ giải lao giữa phiên'],
  focusPattern: 'Bắt đầu tốt, giảm dần sau 15 phút',
});

describe('buildAnalysisInput', () => {
  it('should build correct sessionMeta from session', () => {
    const session = createMockSession();
    const input = buildAnalysisInput(session);

    expect(input.sessionMeta.taskName).toBe('Viết báo cáo đồ án');
    expect(input.sessionMeta.mode).toBe('study');
    expect(input.sessionMeta.duration).toBe(25);
    expect(input.sessionMeta.finalScore).toBe(72);
    expect(input.sessionMeta.cameraEnabled).toBe(true);
    expect(input.sessionMeta.totalSamples).toBe(3);
  });

  it('should compute sampleSummary from session samples', () => {
    const session = createMockSession();
    const input = buildAnalysisInput(session);

    expect(input.sampleSummary.avgFaceConfidence).toBeGreaterThanOrEqual(0);
    expect(input.sampleSummary.avgFaceConfidence).toBeLessThanOrEqual(1);
    expect(input.sampleSummary.avgActivity).toBeGreaterThanOrEqual(0);
    expect(input.sampleSummary.tabComplianceRate).toBeGreaterThanOrEqual(0);
    expect(input.sampleSummary.tabComplianceRate).toBeLessThanOrEqual(1);
    expect(input.sampleSummary.topDomains.length).toBeLessThanOrEqual(5);
  });

  it('should include typedContent truncated to 500 chars', () => {
    const session = createMockSession();
    const longText = 'A'.repeat(800);
    const input = buildAnalysisInput(session, longText);

    expect(input.typedContent).toHaveLength(500);
  });

  it('should include voiceNoteText when provided', () => {
    const session = createMockSession();
    const input = buildAnalysisInput(session, undefined, 'Tôi đã tập trung tốt');

    expect(input.voiceNoteText).toBe('Tôi đã tập trung tốt');
  });

  it('should default finalScore to 0 when undefined', () => {
    const session = createMockSession({ finalScore: undefined });
    const input = buildAnalysisInput(session);

    expect(input.sessionMeta.finalScore).toBe(0);
  });

  it('should handle session with empty samples', () => {
    const session = createMockSession({ samples: [] });
    const input = buildAnalysisInput(session);

    expect(input.sessionMeta.totalSamples).toBe(0);
    expect(input.sampleSummary.topDomains).toEqual([]);
  });
});

describe('analyzeSession', () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should throw when API key is not configured', async () => {
    mockedGetApiKey.mockReturnValue(null);
    const session = createMockSession();

    await expect(analyzeSession(session)).rejects.toThrow('API key chưa được cấu hình');
  });

  it('should call OpenAI API with correct params', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: VALID_AI_RESPONSE } }],
      })),
    );

    const session = createMockSession();
    await analyzeSession(session);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(opts.method).toBe('POST');
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer sk-test-key');

    const body = JSON.parse(opts.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.max_tokens).toBe(1024);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');
  });

  it('should parse valid AI JSON response', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: VALID_AI_RESPONSE } }],
      })),
    );

    const session = createMockSession();
    const result = await analyzeSession(session);

    expect(result.summaryVi).toBe('Phiên tập trung tốt, có sụt giảm cuối.');
    expect(result.summaryEn).toBe('Good focus session with decline towards the end.');
    expect(result.recommendations).toHaveLength(2);
    expect(result.focusPattern).toBe('Bắt đầu tốt, giảm dần sau 15 phút');
  });

  it('should handle JSON wrapped in markdown code block', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    const wrappedResponse = '```json\n' + VALID_AI_RESPONSE + '\n```';
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: wrappedResponse } }],
      })),
    );

    const result = await analyzeSession(createMockSession());
    expect(result.summaryVi).toBeTruthy();
    expect(result.summaryEn).toBeTruthy();
  });

  it('should throw on API HTTP error', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    mockFetch.mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    await expect(analyzeSession(createMockSession())).rejects.toThrow('OpenAI API error 401');
  });

  it('should throw when response has no JSON', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: 'No valid JSON here' } }],
      })),
    );

    await expect(analyzeSession(createMockSession())).rejects.toThrow(
      'AI response không chứa JSON hợp lệ',
    );
  });

  it('should fallback for missing fields in AI response', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    const partialJson = JSON.stringify({ summaryVi: 'Có', recommendations: 123 });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: partialJson } }],
      })),
    );

    const result = await analyzeSession(createMockSession());
    expect(result.summaryVi).toBe('Có');
    expect(result.summaryEn).toBe('No summary available.');
    expect(result.recommendations).toEqual([]);
    expect(result.focusPattern).toBe('');
  });

  it('should limit recommendations to 5', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    const manyRecs = JSON.stringify({
      summaryVi: 'OK',
      summaryEn: 'OK',
      recommendations: ['1', '2', '3', '4', '5', '6', '7'],
      focusPattern: 'test',
    });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: manyRecs } }],
      })),
    );

    const result = await analyzeSession(createMockSession());
    expect(result.recommendations).toHaveLength(5);
  });

  it('should include voiceNoteText in prompt when provided', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: VALID_AI_RESPONSE } }],
      })),
    );

    await analyzeSession(createMockSession(), undefined, 'Tôi cảm thấy tập trung');
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string);
    const userMessage = body.messages[1].content;
    expect(userMessage).toContain('Tôi cảm thấy tập trung');
  });

  it('should handle task name with Vietnamese diacritics', async () => {
    mockedGetApiKey.mockReturnValue('sk-test-key');
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: VALID_AI_RESPONSE } }],
      })),
    );

    const session = createMockSession({
      config: {
        ...createMockSession().config,
        taskName: 'Đọc tài liệu kỹ thuật phần mềm',
      },
    });

    await analyzeSession(session);
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string);
    expect(body.messages[1].content).toContain('Đọc tài liệu kỹ thuật phần mềm');
  });
});
