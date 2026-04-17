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

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 1024;

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
function buildPrompt(input: AIAnalysisInput): Array<{ role: string; content: string }> {
  const systemPrompt = `You are FocusProof AI Analyst. Analyze focus session data and provide actionable insights.
Respond in JSON with exactly these fields:
{
  "summaryVi": "Tóm tắt phiên bằng tiếng Việt (2-3 câu)",
  "summaryEn": "Session summary in English (2-3 sentences)",
  "recommendations": ["Gợi ý cải thiện 1 (tiếng Việt)", "Gợi ý 2", "Gợi ý 3"],
  "focusPattern": "Mô tả pattern tập trung ngắn gọn (tiếng Việt)"
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
      `Top Domains: ${input.sampleSummary.topDomains.map((d) => `${d.domain}(${d.count})`).join(', ')}`,
    );
  }

  if (input.typedContent) {
    parts.push(`\nLast typed content (500 chars): "${input.typedContent}"`);
  }

  if (input.voiceNoteText) {
    parts.push(`\nVoice note summary: "${input.voiceNoteText}"`);
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: parts.join('\n') },
  ];
}

/**
 * Gọi GPT-4o-mini API và parse kết quả.
 * Chỉ gọi khi user đã opt-in.
 *
 * @throws Error nếu API key chưa cấu hình, network lỗi, hoặc response invalid
 */
export async function analyzeSession(
  session: SessionData,
  typedContent?: string,
  voiceNoteText?: string,
): Promise<AIAnalysisResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key chưa được cấu hình. Kiểm tra VITE_OPENAI_API_KEY trong .env');
  }

  const input = buildAnalysisInput(session, typedContent, voiceNoteText);
  const messages = buildPrompt(input);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    }),
  });

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
