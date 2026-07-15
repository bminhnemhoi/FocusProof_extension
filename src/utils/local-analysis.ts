/**
 * FocusProof – Local (Offline) Analysis Engine
 *
 * Tạo phân tích phiên tập trung 100% cục bộ, KHÔNG cần API key, KHÔNG gọi
 * mạng. Đây là "lưới an toàn" cho tính năng Insight:
 *  - Nếu backend proxy / API key đã cấu hình  → dùng GPT (ai-analysis.ts).
 *  - Nếu chưa cấu hình HOẶC gọi remote lỗi     → dùng bản offline này.
 *
 * Nhờ vậy nút "Phân tích" luôn cho ra kết quả có ý nghĩa khi demo, thay vì
 * báo lỗi "API key chưa được cấu hình".
 *
 * Kết quả tuân theo cùng interface AIAnalysisResult để tái dùng toàn bộ UI
 * và trang 2 của chứng chỉ PDF.
 */

import type { AIAnalysisResult, SessionData } from './types';
import { computeSessionStats, getGrade } from './focus';

/** Chọn phần tử theo ngưỡng: trả về nhánh đầu tiên có điều kiện đúng. */
function pick<T>(cases: Array<[boolean, T]>, fallback: T): T {
  for (const [cond, value] of cases) if (cond) return value;
  return fallback;
}

/**
 * Sinh phân tích offline dựa trên thống kê phiên. Deterministic (cùng input
 * → cùng output) nên dễ kiểm thử và không phụ thuộc dịch vụ ngoài.
 */
export function generateLocalAnalysis(session: SessionData): AIAnalysisResult {
  const stats = computeSessionStats(session);
  const score = session.finalScore ?? 0;
  const grade = getGrade(score);
  const compliancePct = Math.round(stats.tabComplianceRate * 100);
  const activityPct = Math.round(stats.avgActivityScore * 100);
  const facePct = Math.round(stats.avgFaceConfidence * 100);
  const { alertCount } = stats;
  const cam = session.config.cameraEnabled;
  const task = session.config.taskName;

  // ── Điểm mạnh (luôn mở đầu tích cực) ──
  const strength = pick<string>(
    [
      [compliancePct >= 90, `bạn bám rất sát mục tiêu (${compliancePct}% thời gian đúng nội dung)`],
      [activityPct >= 70, `bạn duy trì nhịp làm việc đều và tích cực`],
      [cam && facePct >= 70, `bạn hiện diện trước màn hình ổn định`],
      [alertCount === 0, `cả phiên không có cảnh báo xao nhãng nào`],
    ],
    `bạn đã hoàn thành trọn vẹn phiên "${task}"`,
  );

  // ── Điểm cần cải thiện chính ──
  const weakness = pick<{ vi: string; rec: string }>(
    [
      [
        compliancePct < 70,
        {
          vi: `có ${100 - compliancePct}% thời gian bạn ở nội dung ngoài mục tiêu`,
          rec: 'Thu hẹp danh sách domain cho phép và đóng bớt tab không liên quan trước khi bắt đầu.',
        },
      ],
      [
        activityPct < 40,
        {
          vi: `nhịp thao tác hơi thấp, có thể bạn bị chững lại vài đoạn`,
          rec: 'Thử chia nhỏ công việc thành các mốc 10–15 phút để giữ đà.',
        },
      ],
      [
        cam && facePct < 50,
        {
          vi: `camera nhiều lúc không thấy rõ mặt bạn`,
          rec: 'Chỉnh lại góc/ánh sáng camera để tín hiệu hiện diện chính xác hơn.',
        },
      ],
      [
        alertCount >= 3,
        {
          vi: `có ${alertCount} lần cảnh báo mất tập trung`,
          rec: 'Bật chế độ Strict và tắt thông báo mạng xã hội để giảm gián đoạn.',
        },
      ],
    ],
    {
      vi: 'gần như không có điểm trừ đáng kể',
      rec: 'Giữ nguyên thói quen này và thử tăng dần thời lượng phiên.',
    },
  );

  const recommendations = [
    weakness.rec,
    pick<string>(
      [
        [score >= 85, 'Bạn đã ở nhóm điểm cao — thử phiên dài hơn (45–60 phút) để rèn sức bền tập trung.'],
        [score >= 55, 'Đặt một mục tiêu nhỏ, đo được cho phiên kế tiếp (ví dụ: nâng tuân thủ lên 90%).'],
      ],
      'Bắt đầu với phiên ngắn 15–20 phút và tăng dần khi đã quen nhịp.',
    ),
    alertCount > 0
      ? 'Xem lại thời điểm các cảnh báo xuất hiện để nhận ra "bẫy xao nhãng" của riêng bạn.'
      : 'Duy trì môi trường yên tĩnh như phiên này cho những lần sau.',
  ];

  const summaryVi =
    `Phiên "${task}" đạt ${Math.round(score)}/100 (hạng ${grade.grade} – ${grade.label}). ` +
    `Điểm sáng: ${strength}. Mình thấy ${weakness.vi}. ` +
    `Nhìn chung bạn đang đi đúng hướng, cố lên nhé!`;

  const summaryEn =
    `Session "${task}" scored ${Math.round(score)}/100 (grade ${grade.grade} – ${grade.labelEn}). ` +
    `Tab compliance ${compliancePct}%, activity ${activityPct}%` +
    (cam ? `, face presence ${facePct}%` : '') +
    `, ${alertCount} alert(s).`;

  const focusPattern = pick<string>(
    [
      [compliancePct >= 85 && activityPct >= 60, 'Tập trung sâu và ổn định — bạn giữ được luồng làm việc liên tục.'],
      [compliancePct >= 85 && activityPct < 60, 'Đúng mục tiêu nhưng nhịp thao tác trồi sụt — có thể xen kẽ đọc/suy nghĩ.'],
      [compliancePct < 60, 'Tập trung bị phân mảnh — thời gian trải ra nhiều nội dung khác nhau.'],
    ],
    'Tập trung ở mức trung bình, còn dư địa để vào luồng sâu hơn.',
  );

  return { summaryVi, summaryEn, recommendations, focusPattern };
}
