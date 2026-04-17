import { useOutletContext } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { CTASection } from '../components/CTASection';
import { useUser } from '../context/UserContext';
import type { LayoutOutletContext } from '../components/Layout';

export default function HomePage() {
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
