/**
 * FocusProof – AI Analysis Module
 * Gọi GPT-4o-mini để phân tích phiên tập trung.
 * Input: session metadata + sample summary + typed content + voice note.
 * Output: summary song ngữ Việt-Anh, recommendations, focus pattern.
 *
 * Reference: y_tuong.md Section 2.3 – AI Analysis (GPT-4o-mini)
 */

import type { AIAnalysisInput, AIAnalysisResult, SessionData } from './types';
import { computeSessionStats } from './focus';
import { getApiKey } from './api-key';
import { getSessionHistory } from './storage';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const MAX_TOKENS_SINGLE = 1024;
const MAX_TOKENS_TREND = 1536;

/** Format thời gian domain (giây → chuỗi dễ đọc) */
function formatDomainDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}p${s}s` : `${m}p`;
}

/**
 * Xây dựng AIAnalysisInput từ SessionData.
 *
 * @param session - Phiên đã hoàn thành
 * @param typedContent - 500 ký tự cuối cùng người dùng đã gõ (optional)
 * @param voiceNoteText - Nội dung voice note đã chuyển thành text (optional)
 */
export function buildAnalysisInput(
  session: SessionData,
  typedContent?: string,
  voiceNoteText?: string,
): AIAnalysisInput {
  const stats = computeSessionStats(session);

  return {
    sessionMeta: {
      taskName: session.config.taskName,
      mode: session.config.mode,
      duration: session.config.durationMinutes,
      totalSamples: stats.totalSamples,
      finalScore: session.finalScore ?? 0,
      cameraEnabled: session.config.cameraEnabled,
    },
    sampleSummary: {
      avgFaceConfidence: Math.round(stats.avgFaceConfidence * 100) / 100,
      avgActivity: Math.round(stats.avgActivityScore * 100) / 100,
      tabComplianceRate: Math.round(stats.tabComplianceRate * 100) / 100,
      alertCount: stats.alertCount,
      topDomains: stats.topDomains.slice(0, 5),
    },
    typedContent: typedContent?.slice(-500),
    voiceNoteText,
  };
}

/**
 * Tạo system + user prompt cho GPT.
 */
function buildPrompt(
  input: AIAnalysisInput,
  trendData?: { recentSessions: string; sevenDayTrend: string },
): Array<{ role: string; content: string }> {
  const systemPrompt = `Bạn là FocusCoach – huấn luyện viên tập trung cá nhân hóa, thân thiện và khích lệ.
Ngôn ngữ: Tiếng Việt tự nhiên, gần gũi, giọng "bạn – mình".
Giọng điệu: Tích cực, không phán xét, tập trung vào tiến bộ và giải pháp.
Luôn bắt đầu bằng điểm tích cực. Dùng câu như "Bạn đang làm tốt ở…", "Mình thấy bạn hơi bị phân tâm vì…".
Tránh câu máy móc kiểu "điểm hoạt động trung bình khá thấp". Đưa ra 3 gợi ý cụ thể, dễ thực hiện.

Respond in JSON with exactly these fields:
{
  "summaryVi": "Tóm tắt thân thiện bằng tiếng Việt (2-3 câu, giọng coaching bạn-mình)",
  "summaryEn": "Session summary in English (2-3 sentences)",
  "recommendations": ["Gợi ý 1 (tiếng Việt, khích lệ)", "Gợi ý 2", "Gợi ý 3"],
  "focusPattern": "Mô tả pattern tập trung (tiếng Việt, thân thiện)"
}
Do NOT include any text outside the JSON object.`;

  const parts: string[] = [
    `Task: "${input.sessionMeta.taskName}" (${input.sessionMeta.mode})`,
    `Duration: ${input.sessionMeta.duration} minutes, ${input.sessionMeta.totalSamples} samples`,
    `Final Score: ${input.sessionMeta.finalScore}/100`,
    `Camera: ${input.sessionMeta.cameraEnabled ? 'ON' : 'OFF'}`,
    '',
    `Face Confidence (avg): ${input.sampleSummary.avgFaceConfidence}`,
    `Activity Score (avg): ${input.sampleSummary.avgActivity}`,
    `Tab Compliance: ${Math.round(input.sampleSummary.tabComplianceRate * 100)}%`,
    `Alerts: ${input.sampleSummary.alertCount}`,
  ];

  if (input.sampleSummary.topDomains.length > 0) {
    parts.push(
      `Top Domains: ${input.sampleSummary.topDomains.map((d) => `${d.domain} (${d.count} lần – ~${formatDomainDuration(d.durationSeconds)})`).join(', ')}`,
    );
  }

  if (input.typedContent) {
    parts.push(`\nLast typed content (500 chars): "${input.typedContent}"`);
  }

  if (input.voiceNoteText) {
    parts.push(`\nVoice note summary: "${input.voiceNoteText}"`);
  }

  if (trendData) {
    parts.push('');
    parts.push('--- Lịch sử & Xu hướng ---');
    parts.push(`5 phiên gần nhất:\n${trendData.recentSessions}`);
    parts.push(`Xu hướng 7 ngày: ${trendData.sevenDayTrend}`);
    parts.push('Hãy so sánh phiên hiện tại với lịch sử, chỉ ra tiến bộ hoặc sụt giảm.');
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: parts.join('\n') },
  ];
}

/**
 * Xây dựng dữ liệu xu hướng từ lịch sử session.
 * Lấy 5 phiên gần nhất (trừ phiên hiện tại) + xu hướng 7 ngày.
 */
async function buildTrendData(currentSessionId: string): Promise<{
  recentSessions: string;
  sevenDayTrend: string;
}> {
  const history = await getSessionHistory();
  // Loại phiên hiện tại khỏi lịch sử
  const past = history.filter((s) => s.id !== currentSessionId);

  // 5 phiên gần nhất
  const recent5 = past.slice(-5);
  const recentSessions =
    recent5.length > 0
      ? recent5
          .map((s) => {
            const score = s.finalScore ?? 0;
            const date = new Date(s.startTime).toLocaleDateString('vi-VN');
            const dur = s.config.durationMinutes;
            return `${date}: "${s.config.taskName}" – ${score}/100 (${dur}ph, ${s.config.mode})`;
          })
          .join('\n')
      : 'Chưa có phiên trước đó.';

  // Xu hướng 7 ngày
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = past.filter((s) => s.startTime >= sevenDaysAgo);
  let sevenDayTrend: string;
  if (weekSessions.length >= 2) {
    const avgScore = Math.round(
      weekSessions.reduce((sum, s) => sum + (s.finalScore ?? 0), 0) / weekSessions.length,
    );
    const totalMinutes = weekSessions.reduce((sum, s) => sum + s.config.durationMinutes, 0);
    sevenDayTrend = `${weekSessions.length} phiên trong 7 ngày, điểm trung bình: ${avgScore}/100, tổng ${totalMinutes} phút tập trung.`;
  } else {
    sevenDayTrend = 'Chưa đủ dữ liệu 7 ngày (cần ít nhất 2 phiên).';
  }

  return { recentSessions, sevenDayTrend };
}

/**
 * Gọi GPT-4o-mini API và parse kết quả.
 * Chỉ gọi khi user đã opt-in.
 *
 * @param session - Phiên cần phân tích
 * @param typedContent - Text đã gõ (optional)
 * @param voiceNoteText - Voice note (optional)
 * @param options - { includeTrend: true } để bật phân tích xu hướng
 * @throws Error nếu API key chưa cấu hình, network lỗi, hoặc response invalid
 */
export async function analyzeSession(
  session: SessionData,
  typedContent?: string,
  voiceNoteText?: string,
  options?: { includeTrend?: boolean },
): Promise<AIAnalysisResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key chưa được cấu hình. Kiểm tra VITE_OPENAI_API_KEY trong .env');
  }

  const input = buildAnalysisInput(session, typedContent, voiceNoteText);

  // Nếu bật trend analysis, lấy dữ liệu lịch sử
  const trendData = options?.includeTrend ? await buildTrendData(session.id) : undefined;

  const messages = buildPrompt(input, trendData);
  const maxTokens = trendData ? MAX_TOKENS_TREND : MAX_TOKENS_SINGLE;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AI analysis timed out after 30 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`OpenAI API error ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? '';

  return parseAIResponse(content);
}

/**
 * Parse JSON response từ GPT, validate đầy đủ fields.
 */
function parseAIResponse(raw: string): AIAnalysisResult {
  // Trích xuất JSON từ response (GPT có thể wrap trong ```json ... ```)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response không chứa JSON hợp lệ');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate & normalize
  return {
    summaryVi: typeof parsed.summaryVi === 'string' ? parsed.summaryVi : 'Không có tóm tắt.',
    summaryEn: typeof parsed.summaryEn === 'string' ? parsed.summaryEn : 'No summary available.',
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((r: unknown) => typeof r === 'string').slice(0, 5)
      : [],
    focusPattern: typeof parsed.focusPattern === 'string' ? parsed.focusPattern : '',
  };
}
