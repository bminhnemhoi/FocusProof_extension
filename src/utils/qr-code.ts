/**
 * FocusProof – QR Code Generator
 * Tạo QR code chứa metadata session để tự xác thực chứng chỉ.
 * QR chứa JSON: { id, hash, score, grade, date }.
 * Hoạt động hoàn toàn local (thư viện qrcode).
 *
 * Reference: y_tuong.md Section 2.3 – Session Hash & QR Code
 */

import QRCode from 'qrcode';
import type { SessionData } from './types';
import { getGrade } from './focus';
import { buildVerifyUrl } from './certificate-signing';

/** Payload nhúng trong QR code */
export interface QRPayload {
  id: string;
  hash: string;
  score: number;
  grade: string;
  date: string;
  task: string;
}

/**
 * Xây dựng payload cho QR code từ session data.
 */
export function buildQRPayload(session: SessionData): QRPayload {
  const score = session.finalScore ?? 0;
  return {
    id: session.id,
    hash: session.hash ?? '',
    score: Math.round(score),
    grade: getGrade(score).grade,
    date: new Date(session.startTime).toISOString().slice(0, 10),
    task: session.config.taskName.slice(0, 50),
  };
}

/**
 * Tạo QR code dưới dạng data URL (PNG base64).
 * Kích thước 200x200 pixels, margin 1.
 *
 * @param session - Phiên đã hoàn thành
 * @returns Data URL string (image/png;base64,...)
 */
export async function generateQRDataUrl(session: SessionData): Promise<string> {
  // Nếu backend verify đã cấu hình → QR chứa URL xác thực THẬT (người xem đối
  // chiếu bản ghi gốc trên server). Nếu chưa → giữ payload JSON tự chứng thực
  // (dấu vân tay toàn vẹn, minh bạch là chưa có xác thực bên thứ ba).
  const verifyUrl = buildVerifyUrl(session);
  const content = verifyUrl ?? JSON.stringify(buildQRPayload(session));

  const dataUrl = await QRCode.toDataURL(content, {
    width: 200,
    margin: 1,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });

  return dataUrl;
}
