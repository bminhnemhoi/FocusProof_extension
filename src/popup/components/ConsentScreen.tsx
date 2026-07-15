/**
 * FocusProof – ConsentScreen Component
 * Màn hình disclosure + consent lần đầu (Chrome Web Store user-data policy):
 * vừa onboarding cách chấm điểm, vừa liệt kê dữ liệu thu thập + 2 opt-in.
 * Đọc/ghi trực tiếp chrome.storage.local key `fp_consent` — KHÔNG qua storage.ts.
 */

import { useState } from 'react';
import '../styles/ConsentScreen.css';
import { buildConsent, saveConsent } from '@/utils/consent';
import type { ConsentRecord } from '@/utils/consent';

// ============================================================
// Component
// ============================================================

interface ConsentScreenProps {
  /** Gọi sau khi user bấm "Đồng ý & bắt đầu" và consent đã được lưu */
  onConsent: (record: ConsentRecord) => void;
}

/** 3 tín hiệu chấm điểm — nội dung disclosure ngắn gọn */
const SIGNALS: Array<{ icon: string; title: string; desc: string }> = [
  {
    icon: '😊',
    title: 'Khuôn mặt (camera — tùy chọn)',
    desc: 'Chỉ phát hiện CÓ/KHÔNG có khuôn mặt trước màn hình. Xử lý 100% trên máy bạn — không một ảnh/video nào rời khỏi thiết bị.',
  },
  {
    icon: '⌨️',
    title: 'Hoạt động bàn phím & chuột',
    desc: 'Chỉ ĐẾM số lần gõ phím, click, cuộn trang để biết bạn đang làm việc. Không ghi lại nội dung bạn gõ.',
  },
  {
    icon: '🎯',
    title: 'Tab đang mở',
    desc: 'Chỉ xem domain của tab (vd: docs.google.com) để biết bạn có bám đúng mục tiêu — không đọc nội dung trang.',
  },
];

export default function ConsentScreen({ onConsent }: ConsentScreenProps) {
  const [aiCloudOptIn, setAiCloudOptIn] = useState(false); // mặc định TẮT
  const [captureTyped, setCaptureTyped] = useState(false); // mặc định TẮT
  const [saving, setSaving] = useState(false);

  /** Tắt AI cloud thì tắt luôn captureTyped (phụ thuộc) */
  function toggleAiCloud() {
    setAiCloudOptIn((prev) => {
      if (prev) setCaptureTyped(false);
      return !prev;
    });
  }

  /** Lưu consent rồi vào app */
  async function handleAgree() {
    if (saving) return;
    setSaving(true);
    const record = buildConsent(aiCloudOptIn, captureTyped);
    try {
      await saveConsent(record);
    } catch {
      // Storage lỗi hiếm gặp — vẫn cho vào app, lần mở sau sẽ hỏi lại
    }
    onConsent(record);
  }

  return (
    <div className="consent-screen">
      {/* ── Phần a: Giới thiệu cách chấm điểm (onboarding + disclosure) ── */}
      <div className="consent-hero">
        <span className="consent-hero-icon">🛡️</span>
        <h2 className="consent-title">FocusProof chấm điểm thế nào?</h2>
        <p className="consent-sub">
          Trong phiên tập trung, 3 tín hiệu sau được tổng hợp thành điểm và xếp hạng{' '}
          <strong>S → F</strong> cuối phiên:
        </p>
      </div>

      <div className="consent-signals">
        {SIGNALS.map((s) => (
          <div className="consent-signal" key={s.title}>
            <span className="consent-signal-icon" aria-hidden="true">{s.icon}</span>
            <div>
              <p className="consent-signal-title">{s.title}</p>
              <p className="consent-signal-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Phần b: Dữ liệu sử dụng + 2 opt-in riêng ── */}
      <h3 className="consent-section-title">📋 Dữ liệu FocusProof sử dụng</h3>
      <ul className="consent-data-list">
        <li>Trạng thái có/không khuôn mặt (không lưu ảnh hay video)</li>
        <li>Số lượng thao tác phím, chuột, cuộn (chỉ con số)</li>
        <li>Domain của tab đang xem trong phiên</li>
        <li>Kết quả phiên lưu <strong>cục bộ trên máy bạn</strong></li>
      </ul>

      <h3 className="consent-section-title">⚙️ Tùy chọn thêm (mặc định tắt)</h3>
      <div className="consent-optins">
        <div className="consent-optin">
          <div className="consent-optin-row">
            <span className="consent-optin-label" id="consent-ai-label">
              ☁️ Phân tích AI trên cloud
            </span>
            <button
              className={`toggle ${aiCloudOptIn ? 'toggle--on' : ''}`}
              onClick={toggleAiCloud}
              type="button"
              role="switch"
              aria-checked={aiCloudOptIn}
              aria-labelledby="consent-ai-label"
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          <p className="consent-optin-desc">
            Gửi <strong>thống kê tổng hợp</strong> của phiên (điểm, số cảnh báo, domain chính)
            tới server AI để nhận nhận xét cá nhân hóa. Không bắt buộc.
          </p>
        </div>

        <div className={`consent-optin ${!aiCloudOptIn ? 'consent-optin--disabled' : ''}`}>
          <div className="consent-optin-row">
            <span className="consent-optin-label" id="consent-typed-label">
              ⌨️ Gửi kèm 500 ký tự gõ cuối cho AI
            </span>
            <button
              className={`toggle ${captureTyped ? 'toggle--on' : ''}`}
              onClick={() => setCaptureTyped((v) => !v)}
              type="button"
              role="switch"
              aria-checked={captureTyped}
              aria-labelledby="consent-typed-label"
              disabled={!aiCloudOptIn}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          <p className="consent-optin-desc">
            Giúp AI hiểu ngữ cảnh bạn đang làm gì. <strong>Không bao giờ</strong> thu từ ô mật khẩu.
            Chỉ bật được khi Phân tích AI ở trên đang bật.
          </p>
        </div>
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={handleAgree}
        disabled={saving}
        type="button"
      >
        {saving ? '⏳ Đang lưu...' : '✅ Đồng ý & bắt đầu'}
      </button>
      <p className="consent-footnote">
        Bạn có thể thay đổi các lựa chọn này bất cứ lúc nào trong phần cài đặt.
      </p>
    </div>
  );
}
