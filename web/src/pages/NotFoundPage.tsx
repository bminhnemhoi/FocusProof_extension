import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-narrow flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-7xl font-extrabold text-bg-border">404</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Trang không tồn tại</h1>
      <p className="mt-2 max-w-md text-slate-400">
        Có vẻ như bạn đã đi lạc. Đường link này không có trong hệ thống của chúng tôi.
      </p>
      <Link to="/" className="btn-primary mt-6">
        ← Về trang chủ
      </Link>
    </div>
  );
}
