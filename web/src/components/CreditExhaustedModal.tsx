import { Modal } from './Modal';

interface CreditExhaustedModalProps {
  open: boolean;
  onClose: () => void;
  /** Số credit còn lại (dùng để hiển thị 0 hoặc gần 0). */
  currentCredits: number;
  /** Loại tính năng vừa bị chặn — chỉ để hiển thị thông báo phù hợp. */
  feature?: 'ai_single' | 'ai_trend';
  /** Callback khi user chọn "Mua ngay" → parent scroll xuống pricing + (tùy chọn) mở modal. */
  onBuyNow: () => void;
  /** Callback khi user chọn "Mời bạn bè" → parent xử lý copy referral link. */
  onInviteFriends: () => void;
}

const FEATURE_LABEL: Record<NonNullable<CreditExhaustedModalProps['feature']>, { name: string; cost: number }> = {
  ai_single: { name: 'AI Analysis (Single Session)', cost: 20 },
  ai_trend: { name: 'AI Trend 7 ngày', cost: 50 },
};

/**
 * Popup hiển thị khi user hết Credit và cố dùng tính năng AI.
 * 3 lựa chọn theo y_tuong_v1.1.md mục 6:
 *   1) 🛒 Mua ngay (chuyển sang upgrade Pro)
 *   2) 🎁 Mời bạn bè (referral +20 Credit)
 *   3) Bỏ qua (đóng modal)
 */
export function CreditExhaustedModal({
  open,
  onClose,
  currentCredits,
  feature = 'ai_single',
  onBuyNow,
  onInviteFriends,
}: CreditExhaustedModalProps) {
  const info = FEATURE_LABEL[feature];

  return (
    <Modal open={open} onClose={onClose} size="md">
      {/* Icon hero */}
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-amber/20 to-accent-red/20 ring-1 ring-accent-amber/30">
          <span className="text-3xl">💳</span>
        </div>
      </div>

      <h3 className="mt-4 text-center text-xl font-bold text-white">Bạn đã hết Credit</h3>
      <p className="mt-2 text-center text-sm text-slate-400">
        Tính năng <span className="font-semibold text-white">{info.name}</span> cần{' '}
        <span className="font-semibold text-accent-amber">{info.cost} Credit</span>, nhưng bạn
        chỉ còn <span className="font-semibold text-accent-red">{currentCredits}</span>.
      </p>

      {/* Options */}
      <div className="mt-6 flex flex-col gap-3">
        {/* Option 1: Mua ngay (recommended) */}
        <button
          type="button"
          onClick={() => {
            onBuyNow();
            onClose();
          }}
          className="group flex items-center gap-4 rounded-xl border border-brand-500/40 bg-brand-500/10 p-4 text-left transition-all hover:border-brand-500/70 hover:bg-brand-500/15 hover:shadow-glow"
        >
          <span className="text-2xl">🛒</span>
          <div className="flex-1">
            <p className="font-semibold text-white">Nâng cấp Pro — Unlimited Credit</p>
            <p className="text-xs text-slate-400">
              Chỉ $4.99/tháng. AI Analysis không giới hạn + PDF nâng cao + Export CSV.
            </p>
          </div>
          <span className="badge bg-brand-500 text-white">Khuyến nghị</span>
        </button>

        {/* Option 2: Mời bạn bè */}
        <button
          type="button"
          onClick={() => {
            onInviteFriends();
            onClose();
          }}
          className="flex items-center gap-4 rounded-xl border border-bg-border bg-bg-elevated p-4 text-left transition-all hover:border-accent-green/40 hover:bg-accent-green/5"
        >
          <span className="text-2xl">🎁</span>
          <div className="flex-1">
            <p className="font-semibold text-white">Mời bạn bè — Nhận +20 Credit/người</p>
            <p className="text-xs text-slate-400">
              Bạn bè cài extension và hoàn thành 1 session ≥5 phút là cả 2 cùng nhận thưởng.
            </p>
          </div>
        </button>

        {/* Option 3: Bỏ qua */}
        <button type="button" onClick={onClose} className="btn-ghost w-full justify-center py-3">
          Bỏ qua, tiếp tục dùng Free
        </button>
      </div>

      <p className="mt-5 text-center text-xs text-slate-500">
        💡 Bạn vẫn dùng được mọi tính năng cốt lõi miễn phí (session, PDF cơ bản, QR xác thực).
      </p>
    </Modal>
  );
}
