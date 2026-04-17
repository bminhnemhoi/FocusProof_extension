import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { PricingSection } from '../components/PricingSection';
import { FAQSection } from '../components/FAQSection';
import { QRPaymentModal } from '../components/QRPaymentModal';
import { CreditExhaustedModal } from '../components/CreditExhaustedModal';
import { useUser } from '../context/UserContext';
import type { BillingCycle, PricingTier } from '../types';
import type { LayoutOutletContext } from '../components/Layout';

export default function PricingPage() {
  const { openAuth } = useOutletContext<LayoutOutletContext>();
  const { user, isAuthenticated, upgradeTo } = useUser();

  const [qrOpen, setQrOpen] = useState(false);
  const [qrTier, setQrTier] = useState<PricingTier | null>(null);
  const [qrCycle, setQrCycle] = useState<BillingCycle>('monthly');
  const [creditExhaustedOpen, setCreditExhaustedOpen] = useState(false);

  const handleBuy = (tier: PricingTier, cycle: BillingCycle) => {
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
  const handleSimulatePaymentSuccess = () => {
    upgradeTo('pro');
    setQrOpen(false);
    alert('🎉 Thanh toán thành công! Tài khoản đã được nâng cấp Pro với Credit không giới hạn.');
  };

  const handleInviteFriends = async () => {
    const referralUrl = `${window.location.origin}/?ref=${user?.email?.split('@')[0] ?? 'DEMO'}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      alert(`Đã copy link mời bạn:\n${referralUrl}\n\nMỗi bạn cài + 1 session ≥5 phút = +20 Credit.`);
    } catch {
      alert(`Link mời bạn:\n${referralUrl}`);
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
