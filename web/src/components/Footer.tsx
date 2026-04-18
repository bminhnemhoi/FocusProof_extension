import { Link } from 'react-router-dom';
import { useT } from '../context/LanguageContext';
import type { TranslationKey } from '../context/LanguageContext';

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-bg-border bg-bg-surface/50">
      <div className="container-narrow py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">FocusProof</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{t('footer.tagline')}</p>
          </div>

          <FooterCol title={t('footer.sectionProduct')}>
            <FooterLink to="/" labelKey="nav.home" />
            <FooterLink to="/pricing" labelKey="nav.pricing" />
            <FooterLink to="/verify" labelKey="nav.verify" />
            <FooterLink to="/dashboard" labelKey="nav.dashboard" />
          </FooterCol>

          <FooterCol title={t('footer.sectionBusiness')}>
            <FooterLink to="/team" label={t('footer.teamDashboard')} />
            <FooterLink to="/contact" label={t('footer.contactSales')} />
            <FooterExternal href="mailto:hello@focusproof.com">hello@focusproof.com</FooterExternal>
          </FooterCol>

          <FooterCol title={t('footer.sectionLegal')}>
            <FooterLink to="/privacy" labelKey="nav.privacy" />
            <FooterLink to="/terms" labelKey="nav.terms" />
            <FooterExternal href="https://github.com/focusproof">GitHub</FooterExternal>
          </FooterCol>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-bg-border pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">{t('footer.rights')}</p>
          <p className="text-xs text-slate-500">{t('footer.challenge')}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  labelKey,
  label,
}: {
  to: string;
  labelKey?: TranslationKey;
  label?: string;
}) {
  const t = useT();
  const text = label ?? (labelKey ? t(labelKey) : '');
  return (
    <li>
      <Link to={to} className="text-slate-400 transition-colors hover:text-white">
        {text}
      </Link>
    </li>
  );
}

function FooterExternal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
        className="text-slate-400 transition-colors hover:text-white"
      >
        {children}
      </a>
    </li>
  );
}
