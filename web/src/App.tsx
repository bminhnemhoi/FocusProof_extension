import { Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PageLoader } from './components/PageLoader';
import { usePageViewTracker } from './context/AnalyticsContext';

// Lazy routes — code-splitting để initial bundle nhỏ hơn
const HomePage = lazy(() => import('./pages/HomePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TeamDashboardPage = lazy(() => import('./pages/TeamDashboardPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const { pathname } = useLocation();

  // Scroll to top khi đổi route
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  // Track page view khi đổi route (no-op nếu chưa consent)
  usePageViewTracker(pathname);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/pricing"
          element={
            <Suspense fallback={<PageLoader />}>
              <PricingPage />
            </Suspense>
          }
        />
        <Route
          path="/demo"
          element={
            <Suspense fallback={<PageLoader />}>
              <DemoPage />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/team"
          element={
            <Suspense fallback={<PageLoader />}>
              <TeamDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/verify"
          element={
            <Suspense fallback={<PageLoader />}>
              <VerifyPage />
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<PageLoader />}>
              <ContactPage />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<PageLoader />}>
              <PrivacyPage />
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<PageLoader />}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
