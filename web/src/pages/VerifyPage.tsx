import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type VerifyResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'valid'; data: { sessionId: string; date: string; focusScore: number; user: string } }
  | { status: 'invalid'; reason: string };

/**
 * VerifyPage — người nhận PDF Certificate quét QR → vào trang này → đối chiếu hash.
 *
 * Phase 2 (HIỆN TẠI): mock validation logic. Hash bắt đầu bằng "FP-" → valid.
 * Phase Supabase: POST /verify với hash → backend tra session_summaries → trả về metadata.
 */
export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const initialHash = searchParams.get('hash') ?? '';
  const [hash, setHash] = useState(initialHash);
  const [result, setResult] = useState<VerifyResult>({ status: 'idle' });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hash.trim();
    if (!trimmed) return;

    setResult({ status: 'loading' });

    // Mock latency + validation
    setTimeout(() => {
      if (trimmed.startsWith('FP-') && trimmed.length >= 16) {
        setResult({
          status: 'valid',
          data: {
            sessionId: trimmed,
            date: '2026-04-15 14:30',
            focusScore: 87,
            user: 'minh.anh@example.com',
          },
        });
      } else {
        setResult({
          status: 'invalid',
          reason: 'Hash không khớp với bất kỳ chứng chỉ nào trong hệ thống.',
        });
      }
    }, 600);
  };

  return (
    <div className="container-narrow py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="badge bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30">
            🔐 Xác thực chứng chỉ
          </span>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Verify Certificate</h1>
          <p className="mt-3 text-slate-400">
            Nhập hash trên PDF Certificate (hoặc quét QR) để xác minh tính hợp lệ.
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-10 card">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Certificate Hash (SHA-256)
            </span>
            <input
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="FP-A1B2C3D4-E5F6-..."
              className="rounded-lg border border-bg-border bg-bg px-4 py-3 font-mono text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>

          <button
            type="submit"
            disabled={!hash.trim() || result.status === 'loading'}
            className="btn-primary mt-4 w-full justify-center py-3 text-base"
          >
            {result.status === 'loading' ? 'Đang xác thực...' : 'Xác thực'}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            💡 Demo: nhập bất kỳ chuỗi bắt đầu bằng <span className="font-mono">FP-</span> ≥16 ký tự.
          </p>
        </form>

        {/* Result */}
        {result.status === 'valid' && (
          <div className="mt-6 card animate-fadeIn border-accent-green/40">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/15 text-2xl ring-1 ring-accent-green/40">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-accent-green">Chứng chỉ hợp lệ</h3>
                <p className="text-xs text-slate-400">Hash khớp 100% với dữ liệu trong hệ thống.</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-bg-border pt-5 text-sm">
              <dt className="text-slate-400">Session ID</dt>
              <dd className="break-all text-right font-mono text-white">{result.data.sessionId}</dd>
              <dt className="text-slate-400">Ngày tạo</dt>
              <dd className="text-right text-white">{result.data.date}</dd>
              <dt className="text-slate-400">Focus Score</dt>
              <dd className="text-right">
                <span className="badge bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30">
                  {result.data.focusScore}/100
                </span>
              </dd>
              <dt className="text-slate-400">User</dt>
              <dd className="text-right text-white">{result.data.user}</dd>
            </dl>
          </div>
        )}

        {result.status === 'invalid' && (
          <div className="mt-6 card animate-fadeIn border-accent-red/40">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-red/15 text-2xl ring-1 ring-accent-red/40">
                ✕
              </div>
              <div>
                <h3 className="text-lg font-bold text-accent-red">Chứng chỉ KHÔNG hợp lệ</h3>
                <p className="text-xs text-slate-400">{result.reason}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Có thể PDF đã bị chỉnh sửa, hoặc hash bị nhập sai. Vui lòng quét lại QR Code trên PDF gốc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
