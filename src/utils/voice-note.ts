/**
 * FocusProof – Voice Note Module
 * Ghi âm tóm tắt sau session bằng Web Speech API (SpeechRecognition).
 * Tối đa 30 giây, không lưu file audio, chỉ chuyển thành text.
 *
 * Reference: y_tuong.md Section 2.3 – Voice Note Summary
 */

/** Kết quả ghi âm voice note */
export interface VoiceNoteResult {
  text: string;
  durationMs: number;
}

/** Kiểm tra trình duyệt có hỗ trợ Web Speech API không */
export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

/**
 * Bắt đầu ghi âm voice note.
 * Tự động dừng sau 30 giây hoặc khi user gọi stop.
 *
 * @returns Promise resolve với text đã chuyển đổi
 * @throws Error nếu không hỗ trợ hoặc bị deny microphone
 */
export function startVoiceNote(): {
  promise: Promise<VoiceNoteResult>;
  stop: () => void;
} {
  if (!isSpeechRecognitionSupported()) {
    return {
      promise: Promise.reject(new Error('Trình duyệt không hỗ trợ Speech Recognition')),
      stop: () => {},
    };
  }

  const SpeechRecognitionCtor =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new (SpeechRecognitionCtor as any)() as SpeechRecognition;
  recognition.lang = 'vi-VN';
  recognition.interimResults = false;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  const MAX_DURATION_MS = 30_000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const startTime = Date.now();
  const transcriptParts: string[] = [];

  const promise = new Promise<VoiceNoteResult>((resolve, reject) => {
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptParts.push(event.results[i][0].transcript);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        reject(new Error('Không thể ghi âm do quyền micro bị chặn'));
      } else {
        reject(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const text = transcriptParts.join(' ').trim();
      resolve({
        text,
        durationMs: Date.now() - startTime,
      });
    };

    // Auto-stop sau 30 giây
    timeoutId = setTimeout(() => {
      recognition.stop();
    }, MAX_DURATION_MS);

    recognition.start();
  });

  const stop = () => {
    if (timeoutId) clearTimeout(timeoutId);
    recognition.stop();
  };

  return { promise, stop };
}
