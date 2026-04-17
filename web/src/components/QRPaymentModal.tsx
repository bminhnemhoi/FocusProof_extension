import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import type { BillingCycle, PricingTier } from '../types';

interface QRPaymentModalProps {
  open: boolean;
  onClose: () => void;
  tier: PricingTier | null;
  cycle: BillingCycle;
  /** Demo only: mô phỏng "thanh toán xong" → upgrade plan ngay. Phase Supabase: webhook tự cập nhật. */
  onSimulateSuccess?: () => void;
}

/**
 * Sinh nội dung QR Momo theo chuẩn deeplink Momo Personal:
 *   momo://transfer?phone=<phone>&amount=<amount>&note=<note>
 *
 * LƯU Ý: Đây là QR TĨNH demo. Khi tích hợp thật:
 * - Dùng Momo Business API → server trả về `payUrl` + `qrCodeUrl` động.
 * - Mỗi giao dịch có `orderId` duy nhất để webhook activate license.
 * - File này chỉ cần thay logic `buildMomoPayload()` là chuyển sang động được.
 */
function buildMomoPayload(amountUSD: number, orderId: string): string {
  // Quy đổi tạm thời: 1 USD ≈ 25,500 VND. Sản xuất nên gọi API tỷ giá.
  const VND_PER_USD = 25_500;
  const amountVND = Math.round(amountUSD * VND_PER_USD);

  // TODO: Thay bằng số Momo merchant thật khi đăng ký Business
  const MOMO_MERCHANT_PHONE = '0987654321';

  const note = `FOCUSPROOF ${orderId}`;
  const params = new URLSearchParams({
    phone: MOMO_MERCHANT_PHONE,
    amount: amountVND.toString(),
    note,
  });
  return `momo://transfer?${params.toString()}`;
}

export function QRPaymentModal({ open, onClose, tier, cycle, onSimulateSuccess }: QRPaymentModalProps) {
  const [copied, setCopied] = useState(false);

  // Payload + amount memoized theo tier/cycle
  const { qrPayload, amountUSD, amountVND, orderId } = useMemo(() => {
    if (!tier) return { qrPayload: '', amountUSD: 0, amountVND: 0, orderId: '' };
    const amount = cycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
    const oid = `FP${Date.now().toString(36).toUpperCase()}`;
    return {
      qrPayload: buildMomoPayload(amount, oid),
      amountUSD: amount,
      amountVND: Math.round(amount * 25_500),
      orderId: oid,
    };
  }, [tier, cycle]);

  if (!tier) return null;

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard có thể bị block trong iframe — bỏ qua */
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" title={`Thanh toán gói ${tier.name}`}>
      <div className="flex flex-col items-center">
        {/* Plan summary */}
        <div className="w-full rounded-xl border border-bg-border bg-bg-elevated p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Gói</span>
            <span className="font-semibold text-white">
              FocusProof {tier.name} — {cycle === 'yearly' ? 'Năm' : 'Tháng'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-400">Số tiền</span>
            <span className="font-mono font-semibold text-white">
              ${amountUSD} ≈ {amountVND.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-400">Mã đơn hàng</span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="flex items-center gap-1.5 font-mono text-brand-400 hover:text-brand-300"
              title="Copy mã đơn hàng"
            >
              {orderId}
              <span className="text-xs">{copied ? '✓ Đã copy' : '📋'}</span>
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="mt-6 rounded-2xl border-2 border-accent-momo/40 bg-white p-4">
          <QRCodeSVG
            value={qrPayload}
            size={220}
            level="M"
            // Logo Momo ở giữa (text fallback nếu không load được)
            imageSettings={{
              src:
                'data:image/svg+xml;utf8,' +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#A50064"/><text x="20" y="26" font-family="Inter,sans-serif" font-weight="800" font-size="14" fill="white" text-anchor="middle">M</text></svg>`,
                ),
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 w-full">
          <p className="text-sm font-semibold text-white">Cách thanh toán:</p>
          <ol className="mt-2 space-y-1.5 text-sm text-slate-400">
            <li>
              <span className="font-semibold text-accent-momo">1.</span> Mở app{' '}
              <span className="font-semibold text-white">Momo</span> trên điện thoại
            </li>
            <li>
              <span className="font-semibold text-accent-momo">2.</span> Chọn{' '}
              <span className="font-semibold text-white">Quét mã</span> → quét QR phía trên
            </li>
            <li>
              <span className="font-semibold text-accent-momo">3.</span> Xác nhận chuyển khoản
              (mã đơn hàng đã được điền sẵn)
            </li>
            <li>
              <span className="font-semibold text-accent-momo">4.</span> License Key sẽ được gửi
              vào email trong vòng 1 phút
            </li>
          </ol>
        </div>

        {/* Help */}
        <div className="mt-5 w-full rounded-lg border border-bg-border bg-bg/50 p-3 text-xs text-slate-500">
          💡 <span className="font-semibold text-slate-300">Cần hỗ trợ?</span> Email{' '}
          <a href="mailto:hello@focusproof.com" className="text-brand-400 hover:underline">
            hello@focusproof.com
          </a>{' '}
          kèm mã đơn hàng <span className="font-mono text-slate-300">{orderId}</span>.
        </div>

        {/* Actions */}
        <div className="mt-5 flex w-full gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => window.open(qrPayload, '_blank')}
            className="btn-primary flex-1"
            title="Mở app Momo (chỉ hoạt động trên mobile)"
          >
            Mở app Momo
          </button>
        </div>

        {/* Demo simulator (chỉ hiện ở dev / mock) */}
        {onSimulateSuccess && (
          <button
            type="button"
            onClick={onSimulateSuccess}
            className="mt-3 w-full rounded-md border border-dashed border-bg-border py-2 text-xs text-slate-500 hover:border-accent-green/50 hover:text-accent-green"
            title="Demo: bỏ qua bước thanh toán thật"
          >
            🧪 Demo: Mô phỏng thanh toán thành công
          </button>
        )}
      </div>
    </Modal>
  );
}
