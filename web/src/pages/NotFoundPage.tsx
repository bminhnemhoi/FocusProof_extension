import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import { useT } from '../context/LanguageContext';

export default function NotFoundPage() {
  const t = useT();
  useMeta({
    title: '404 — Trang không tồn tại',
    noindex: true,
  });
  return (
    <div className="container-narrow flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-7xl font-extrabold text-bg-border">404</p>
      <h1 className="mt-4 text-3xl font-bold text-white">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-slate-400">{t('notFound.desc')}</p>
      <Link to="/" className="btn-primary mt-6">
        {t('common.backToHome')}
      </Link>
    </div>
  );
}
