import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import VerifyPage from './pages/VerifyPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * App root — Router config.
 *
 * Routes:
 *   /            — Landing (Hero + Features + How it works + Testimonials + CTA)
 *   /pricing     — Pricing 3 cột + FAQ + QR Momo modal + CreditExhausted modal
 *   /dashboard   — Account: Credit balance, License, Referral, Transactions (yêu cầu login)
 *   /verify      — Verify QR Certificate (public)
 *   *            — 404
 */
export default function App() {
  // Scroll to top khi đổi route
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
