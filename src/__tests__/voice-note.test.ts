/**
 * Unit tests cho voice-note.ts
 * Test isSpeechRecognitionSupported, startVoiceNote (allow/deny micro, auto-stop).
 * Mock SpeechRecognition API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSpeechRecognitionSupported, startVoiceNote } from '@/utils/voice-note';

// ── Mock SpeechRecognition class ──
class MockSpeechRecognition {
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;

  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;

  private _started = false;

  start() {
    this._started = true;
  }

  stop() {
    if (this._started) {
      this._started = false;
      // Trigger onend asynchronously (mimic real behavior)
      queueMicrotask(() => {
        this.onend?.();
      });
    }
  }

  // Test helper: simulate speech result
  _simulateResult(transcript: string, isFinal = true) {
    this.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal,
          0: { transcript },
          length: 1,
        },
      },
    });
  }

  // Test helper: simulate error
  _simulateError(error: string) {
    this.onerror?.({ error });
  }

  // Test helper: trigger onend directly
  _triggerEnd() {
    this.onend?.();
  }
}

let mockInstance: MockSpeechRecognition;

describe('isSpeechRecognitionSupported', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it('should return false when no SpeechRecognition API', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it('should return true when SpeechRecognition is available', () => {
    (window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition;
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it('should return true when webkitSpeechRecognition is available', () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition;
    expect(isSpeechRecognitionSupported()).toBe(true);
  });
});

describe('startVoiceNote', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Capture the instance being created
    mockInstance = null as unknown as MockSpeechRecognition;
    (window as unknown as Record<string, unknown>).SpeechRecognition = class extends MockSpeechRecognition {
      constructor() {
        super();
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockInstance = this;
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it('should reject immediately when speech not supported', async () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    const { promise } = startVoiceNote();
    await expect(promise).rejects.toThrow('Trình duyệt không hỗ trợ Speech Recognition');
  });

  it('should configure recognition with vi-VN and continuous mode', () => {
    startVoiceNote();
    expect(mockInstance.lang).toBe('vi-VN');
    expect(mockInstance.continuous).toBe(true);
    expect(mockInstance.interimResults).toBe(false);
    expect(mockInstance.maxAlternatives).toBe(1);
  });

  it('should resolve with transcript text when stopped', async () => {
    const { promise, stop } = startVoiceNote();

    // Simulate speech results
    mockInstance._simulateResult('Tôi đã tập trung ');
    mockInstance._simulateResult('rất tốt hôm nay');

    // Stop recording
    stop();
    // Need to flush microtask for onend
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result.text).toBe('Tôi đã tập trung  rất tốt hôm nay');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should resolve with empty text when no speech detected', async () => {
    const { promise, stop } = startVoiceNote();

    stop();
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result.text).toBe('');
  });

  it('should auto-stop after 30 seconds', async () => {
    const { promise } = startVoiceNote();

    mockInstance._simulateResult('Nội dung ngắn');

    // Advance to 30s timeout
    await vi.advanceTimersByTimeAsync(30_000);

    const result = await promise;
    expect(result.text).toBe('Nội dung ngắn');
  });

  it('should reject when microphone is denied (not-allowed)', async () => {
    const { promise } = startVoiceNote();

    mockInstance._simulateError('not-allowed');

    await expect(promise).rejects.toThrow('Không thể ghi âm do quyền micro bị chặn');
  });

  it('should reject when microphone is denied (service-not-allowed)', async () => {
    const { promise } = startVoiceNote();

    mockInstance._simulateError('service-not-allowed');

    await expect(promise).rejects.toThrow('Không thể ghi âm do quyền micro bị chặn');
  });

  it('should reject with generic error for other speech errors', async () => {
    const { promise } = startVoiceNote();

    mockInstance._simulateError('network');

    await expect(promise).rejects.toThrow('Speech recognition error: network');
  });

  it('should only collect final results, not interim', async () => {
    const { promise, stop } = startVoiceNote();

    // Interim result (should be ignored since interimResults=false, but testing onresult logic)
    mockInstance.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal: false,
          0: { transcript: 'interim text' },
          length: 1,
        },
      },
    } as unknown as SpeechRecognitionEvent);

    mockInstance._simulateResult('final text');

    stop();
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result.text).toBe('final text');
    expect(result.text).not.toContain('interim');
  });

  it('should measure duration in milliseconds', async () => {
    const { promise, stop } = startVoiceNote();

    // Advance 5 seconds
    await vi.advanceTimersByTimeAsync(5000);

    stop();
    await vi.advanceTimersByTimeAsync(0);

    const result = await promise;
    expect(result.durationMs).toBeGreaterThanOrEqual(5000);
  });
});
