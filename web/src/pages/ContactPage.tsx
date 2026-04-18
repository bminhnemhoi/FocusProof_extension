import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useMeta } from '../hooks/useMeta';

export default function ContactPage() {
  useMeta({
    title: 'Liên hệ — Báo giá Team & Education',
    description:
      'Liên hệ FocusProof để nhận báo giá gói Team, giảm giá 30% cho trường học/NGO, custom branding và SSO.',
    canonicalPath: '/contact',
  });
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', team: '5', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSubmitting(true);
    // Mock latency
    setTimeout(() => {
      toast.success('Đã gửi yêu cầu', 'Chúng tôi sẽ phản hồi trong vòng 24h.');
      setForm({ name: '', email: '', team: '5', message: '' });
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="container-narrow py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="badge bg-accent-purple/10 text-accent-purple ring-1 ring-accent-purple/30">
            🏢 Liên hệ Team / Education
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Báo giá gói Team</h1>
          <p className="mt-3 text-slate-400">
            Điền form để nhận báo giá phù hợp cho tổ chức của bạn. Trường học và NGO được giảm 30%.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 card flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Nguyễn Văn A"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="ban@congty.com"
              />
            </Field>
          </div>

          <Field label="Số lượng thành viên dự kiến">
            <select
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className="input"
            >
              <option value="5">5 — 10 người</option>
              <option value="10">10 — 25 người</option>
              <option value="25">25 — 50 người</option>
              <option value="50">50 — 100 người</option>
              <option value="100">≥ 100 người (Enterprise)</option>
            </select>
          </Field>

          <Field label="Nhu cầu cụ thể" required>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="input resize-none"
              placeholder="Tổ chức của bạn cần gì? (vd: custom branding, SSO, on-prem, billing theo quý...)"
            />
          </Field>

          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Hoặc email trực tiếp:{' '}
            <a href="mailto:hello@focusproof.com" className="text-brand-400 hover:underline">
              hello@focusproof.com
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-accent-red">*</span>}
      </span>
      {children}
    </label>
  );
}
