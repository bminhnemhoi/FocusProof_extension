import type { vi } from './vi';

/**
 * English dictionary — phải match exact shape của vi.ts (TS sẽ báo lỗi nếu lệch).
 */
export const en: typeof vi = {
  common: {
    loading: 'Loading…',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    backToHome: '← Back to home',
    learnMore: 'Learn more',
  },
  nav: {
    home: 'Home',
    pricing: 'Pricing',
    demo: 'Demo',
    verify: 'Verify',
    team: 'Team',
    dashboard: 'Dashboard',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
  },
  header: {
    menu: 'Menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    signin: 'Sign in',
    signup: 'Sign up',
    signupFree: 'Sign up free',
    logout: 'Sign out',
    creditDetail: 'View credit details',
    credits: 'credits',
  },
  footer: {
    tagline: 'Proof of focus. Privacy-first. Made with ❤️ at TDTU.',
    sectionProduct: 'Product',
    sectionBusiness: 'Business',
    sectionLegal: 'Legal & Support',
    teamDashboard: 'Team Dashboard',
    contactSales: 'Contact Sales',
    rights: '© 2026 FocusProof. All rights reserved.',
    challenge: '🏆 TECH STARTUP CHALLENGER 2026',
  },
  cookies: {
    title: 'We respect your privacy',
    description:
      'We only collect anonymous analytics (page views, button clicks) to improve the product. No ad cookies. We never sell data. Read more',
    privacyLink: 'Privacy Policy',
    accept: 'Accept',
    deny: 'Essential only',
  },
  scrollToTop: 'Back to top',
  hero: {
    badge: '🚀 FocusProof v1.1 — Monetization Edition',
    titleLine1: 'Prove your focus',
    titleLine2: 'with real data',
    subtitle:
      'Chrome Extension that measures focus through 3 signals (Camera + Activity + Tab), analyzes with AI, and exports a QR-verified PDF certificate. 100% privacy-first.',
    ctaPrimary: 'See pricing',
    ctaDemo: 'Watch 60s demo',
    ctaSecondary: 'Install from Chrome Web Store',
    statPrivacy: 'Privacy-first',
    statSignals: 'Signals',
    statCredit: 'Onboarding',
    creditUnit: 'Credits',
  },
  cta: {
    title: 'Ready to prove your focus?',
    subtitle: 'Start free with 100 Credits + 7-day Pro trial. No credit card required.',
    ctaAuth: 'Open Dashboard',
    ctaGuest: 'Sign up free',
    ctaSecondary: 'See Pricing',
  },
  language: {
    label: 'Language',
    vi: 'Tiếng Việt',
    en: 'English',
  },
  notFound: {
    title: 'Page not found',
    desc: 'Looks like you got lost. This URL is not in our system.',
  },
};
