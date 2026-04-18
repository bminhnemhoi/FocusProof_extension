import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { PricingSection } from '../components/PricingSection';
import { FAQSection } from '../components/FAQSection';
import { QRPaymentModal } from '../components/QRPaymentModal';
import { CreditExhaustedModal } from '../components/CreditExhaustedModal';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { useMeta } from '../hooks/useMeta';
import type { BillingCycle, PricingTier } from '../types';
import type { LayoutOutletContext } from '../components/Layout';

export default function PricingPage() {
  useMeta({
    title: 'Pricing — Free, Pro $4.99, Team $3.99/người',
    description:
      'So sánh 3 gói FocusProof: Free (100 Credit/máy), Pro ($4.99/tháng — Credit không giới hạn), Team ($3.99/người). Thanh toán qua MoMo, huỷ bất kỳ lúc nào.',
    canonicalPath: '/pricing',
  });

  const { openAuth } = useOutletContext<LayoutOutletContext>();
  const { user, isAuthenticated, upgradeTo } = useUser();
  const toast = useToast();
  const { track } = useAnalytics();

  const [qrOpen, setQrOpen] = useState(false);
  const [qrTier, setQrTier] = useState<PricingTier | null>(null);
  const [qrCycle, setQrCycle] = useState<BillingCycle>('monthly');
  const [creditExhaustedOpen, setCreditExhaustedOpen] = useState(false);

  const handleBuy = (tier: PricingTier, cycle: BillingCycle) => {
    track('pricing_buy_click', { tier: tier.id, cycle });
    // Free → mở Web Store (hoặc AuthModal nếu chưa login)
    if (tier.id === 'free') {
      if (!isAuthenticated) {
        openAuth();
        return;
      }
      window.open('https://chrome.google.com/webstore/', '_blank');
      return;
    }
    // Team → mailto liên hệ
    if (tier.id === 'team') {
      window.location.href = `mailto:hello@focusproof.com?subject=Báo giá gói Team&body=Xin chào, tôi quan tâm gói Team cho ___ người.`;
      return;
    }
    // Pro → cần login trước
    if (!isAuthenticated) {
      openAuth();
      return;
    }
    setQrTier(tier);
    setQrCycle(cycle);
    setQrOpen(true);
  };

  /** Mock: nhấn "Đã thanh toán" → upgrade ngay (Phase Supabase: webhook tự cập nhật). */
  const handleSimulatePaymentSuccess = async () => {
    track('pricing_simulate_payment_success', { tier: qrTier?.id ?? 'unknown', cycle: qrCycle });
    await upgradeTo('pro');
    setQrOpen(false);
    toast.success(
      '🎉 Thanh toán thành công!',
      'Tài khoản đã được nâng cấp Pro với Credit không giới hạn.',
    );
  };

  const handleInviteFriends = async () => {
    const referralUrl = `${window.location.origin}/?ref=${user?.email?.split('@')[0] ?? 'DEMO'}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success(
        'Đã copy link mời bạn!',
        'Mỗi bạn cài + 1 session ≥5 phút = +20 Credit.',
      );
    } catch {
      toast.info('Link mời bạn', referralUrl);
    }
  };

  return (
    <>
      <PricingSection onBuy={handleBuy} />
      <FAQSection />

      <QRPaymentModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        tier={qrTier}
        cycle={qrCycle}
        onSimulateSuccess={handleSimulatePaymentSuccess}
      />

      <CreditExhaustedModal
        open={creditExhaustedOpen}
        onClose={() => setCreditExhaustedOpen(false)}
        currentCredits={user?.credits ?? 0}
        feature="ai_single"
        onBuyNow={() =>
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
        }
        onInviteFriends={handleInviteFriends}
      />
    </>
  );
}
