import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthModal } from './AuthModal';

/**
 * Layout chính — bọc Header + <Outlet/> cho route + Footer + AuthModal global.
 */
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
    </div>
  );
}

/** Type cho useOutletContext trong các page. */
export interface LayoutOutletContext {
  openAuth: () => void;
}
