import { useOutletContext } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { CTASection } from '../components/CTASection';
import { useUser } from '../context/UserContext';
import { useMeta } from '../hooks/useMeta';
import type { LayoutOutletContext } from '../components/Layout';

export default function HomePage() {
  useMeta({
    title: 'Chứng minh sự tập trung của bạn bằng dữ liệu thực',
    description:
      'FocusProof là Chrome extension tạo chứng nhận tập trung có verify bằng QR. AI gợi ý, gamification, 100% privacy-first. Miễn phí 7 ngày trial Pro.',
    canonicalPath: '/',
  });
  const { openAuth } = useOutletContext<LayoutOutletContext>();
  const { isAuthenticated } = useUser();

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection onSignup={openAuth} isAuthenticated={isAuthenticated} />
    </>
  );
}
