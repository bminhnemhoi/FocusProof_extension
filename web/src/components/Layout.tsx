import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthModal } from './AuthModal';
import { ScrollToTopButton } from './ScrollToTopButton';
import { CookieBanner } from './CookieBanner';

export function Layout() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onOpenAuth={() => setAuthOpen(true)} />
      <main className="flex-1">
        <Outlet context={{ openAuth: () => setAuthOpen(true) }} />
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ScrollToTopButton />
      <CookieBanner />
    </div>
  );
}

/** Type cho useOutletContext trong các page. */
export interface LayoutOutletContext {
  openAuth: () => void;
}
