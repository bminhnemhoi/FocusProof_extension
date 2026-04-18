import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import {
  INITIAL_STATE,
  SCENES,
  TOTAL_DURATION,
  type DemoScene,
  type DemoState,
} from '../demo/demoScenario';

type Action =
  | { type: 'reset' }
  | { type: 'apply'; scene: DemoScene };

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'reset':
      return INITIAL_STATE;
    case 'apply':
      return action.scene.apply ? action.scene.apply(state) : state;
    default:
      return state;
  }
}

export default function DemoPage() {
  useMeta({
    title: 'Demo · FocusProof trong 60 giây',
    description: 'Auto-play kịch bản hoàn chỉnh: đăng ký → session → AI → Credit → upgrade Pro → xuất chứng chỉ.',
    canonicalPath: '/demo',
  });

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsedInScene, setElapsedInScene] = useState(0);

  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const scene = SCENES[sceneIdx];

  // Apply scene effect khi vào scene mới
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
    }
    dispatch({ type: 'apply', scene });
    setElapsedInScene(0);
    lastTickRef.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx]);

  // RAF loop điều khiển progress
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      setElapsedInScene((prev) => {
        const next = prev + dt;
        if (next >= scene.duration) {
          if (sceneIdx < SCENES.length - 1) {
            setSceneIdx((i) => i + 1);
            return 0;
          }
          // Hết scene cuối → dừng
          setPlaying(false);
          return scene.duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, sceneIdx, scene.duration]);

  const handleRestart = () => {
    dispatch({ type: 'reset' });
    setSceneIdx(0);
    setElapsedInScene(0);
    setPlaying(true);
  };

  const handleJumpTo = (idx: number) => {
    dispatch({ type: 'reset' });
    setSceneIdx(0);
    setElapsedInScene(0);
    // Replay từ đầu đến idx (apply effect đồng bộ)
    let s = INITIAL_STATE;
    for (let i = 0; i <= idx; i++) {
      const sc = SCENES[i];
      if (sc.apply) s = sc.apply(s);
    }
    // Hack: dispatch các apply tuần tự
    requestAnimationFrame(() => {
      for (let i = 0; i <= idx; i++) {
        dispatch({ type: 'apply', scene: SCENES[i] });
      }
      setSceneIdx(idx);
      setElapsedInScene(0);
      setPlaying(true);
    });
  };

  // Tổng tiến độ
  const overallProgress = useMemo(() => {
    const passed = SCENES.slice(0, sceneIdx).reduce((s, x) => s + x.duration, 0);
    return Math.min(100, ((passed + elapsedInScene) / TOTAL_DURATION) * 100);
  }, [sceneIdx, elapsedInScene]);

  const sceneProgress = Math.min(100, (elapsedInScene / scene.duration) * 100);

  return (
    <div className="container-narrow py-10 sm:py-14">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="badge bg-accent-purple/15 text-accent-purple ring-1 ring-accent-purple/30">
            🎬 Auto-play Demo
          </span>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            FocusProof trong <span className="text-brand-400">60 giây</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Trình diễn hoàn chỉnh user journey · không cần cài đặt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="btn-secondary">
            {playing ? '⏸ Tạm dừng' : '▶ Tiếp tục'}
          </button>
          <button onClick={handleRestart} className="btn-secondary">
            ⟲ Restart
          </button>
          <Link to="/pricing" className="btn-primary">
            Xem bảng giá →
          </Link>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>Tiến độ demo</span>
          <span className="font-mono">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-purple transition-[width] duration-100 ease-linear"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stage */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3: stage */}
        <div className="lg:col-span-2">
          <div className="card relative min-h-[420px] overflow-hidden">
            {/* Decorative glow follows scene */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-700"
              style={{
                background:
                  scene.highlight === 'pricing'
                    ? 'radial-gradient(ellipse at top right, rgba(168,85,247,0.25), transparent 60%)'
                    : scene.highlight === 'credit'
                      ? 'radial-gradient(ellipse at bottom left, rgba(245,158,11,0.2), transparent 60%)'
                      : scene.highlight === 'certificate'
                        ? 'radial-gradient(ellipse at center, rgba(34,197,94,0.18), transparent 60%)'
                        : 'radial-gradient(ellipse at top, rgba(47,128,255,0.18), transparent 60%)',
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">
                  Scene {sceneIdx + 1}/{SCENES.length}
                </span>
                <span>·</span>
                <span>{(scene.duration / 1000).toFixed(1)}s</span>
              </div>
              <h2 key={scene.id} className="mt-2 text-2xl font-bold text-white sm:text-3xl animate-fadeIn">
                {scene.title}
              </h2>
              <p key={scene.id + '-c'} className="mt-3 text-base leading-relaxed text-slate-300 animate-fadeIn">
                {scene.caption}
              </p>

              {/* Scene progress thin bar */}
              <div className="mt-5 h-0.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${sceneProgress}%`, transition: 'width 100ms linear' }}
                />
              </div>

              {/* Live state widgets */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <StateCard label="Tài khoản" value={state.email ?? '—'} sub={state.email ? 'Đã đăng nhập' : 'Chưa đăng ký'} />
                <StateCard
                  label="Plan"
                  value={state.plan.toUpperCase()}
                  sub={state.plan === 'pro' ? '∞ Credit' : '7 ngày trial'}
                  accent={state.plan === 'pro' ? 'purple' : 'default'}
                />
                <StateCard
                  label="Credit"
                  value={Number.isFinite(state.credits) ? state.credits.toString() : '∞'}
                  sub={Number.isFinite(state.credits) ? 'Có giới hạn' : 'Unlimited'}
                  accent={
                    !Number.isFinite(state.credits)
                      ? 'purple'
                      : state.credits <= 5
                        ? 'red'
                        : state.credits <= 30
                          ? 'amber'
                          : 'green'
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <StateCard label="Session" value={`${state.sessionMinutes} phút`} sub="Coding focus" />
                <StateCard
                  label="Focus Score"
                  value={state.focusScore ? `${state.focusScore}/100` : '—'}
                  sub={state.focusScore >= 85 ? 'Excellent' : state.focusScore >= 70 ? 'Good' : '—'}
                  accent={state.focusScore >= 85 ? 'green' : 'default'}
                />
                <StateCard
                  label="Certificate"
                  value={state.certificateIssued ? '✓ Đã xuất' : '—'}
                  sub={state.certificateIssued ? 'PDF + QR' : 'Chưa có'}
                  accent={state.certificateIssued ? 'green' : 'default'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3: timeline + log */}
        <div className="flex flex-col gap-6">
          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-bold text-white">Timeline</h3>
            <ol className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
              {SCENES.map((s, i) => {
                const done = i < sceneIdx;
                const active = i === sceneIdx;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => handleJumpTo(i)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? 'bg-brand-500/15 text-white ring-1 ring-brand-500/30'
                          : done
                            ? 'text-slate-400 hover:bg-bg-elevated'
                            : 'text-slate-500 hover:bg-bg-elevated'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          done
                            ? 'bg-accent-green/20 text-accent-green'
                            : active
                              ? 'bg-brand-500 text-white'
                              : 'bg-bg-elevated text-slate-500'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Activity log */}
          <div className="card">
            <h3 className="text-sm font-bold text-white">Hoạt động</h3>
            {state.log.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">Chưa có sự kiện…</p>
            ) : (
              <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1 font-mono text-[11px] leading-relaxed text-slate-400">
                {state.log.map((entry, i) => (
                  <li key={i} className="border-l-2 border-brand-500/40 pl-2">
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* CTA dưới */}
      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-bg-border bg-bg-surface/50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-base font-semibold text-white">Sẵn sàng dùng thật?</p>
          <p className="text-sm text-slate-400">Đăng ký miễn phí, nhận 100 Credit + 7 ngày trial Pro.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pricing" className="btn-secondary">
            Xem Pricing
          </Link>
          <a
            href="https://chrome.google.com/webstore/"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            🧩 Cài extension
          </a>
        </div>
      </div>
    </div>
  );
}

function StateCard({
  label,
  value,
  sub,
  accent = 'default',
}: {
  label: string;
  value: string;
  sub: string;
  accent?: 'default' | 'green' | 'amber' | 'red' | 'purple';
}) {
  const ringCls =
    accent === 'green'
      ? 'ring-accent-green/30 bg-accent-green/5'
      : accent === 'amber'
        ? 'ring-accent-amber/30 bg-accent-amber/5'
        : accent === 'red'
          ? 'ring-accent-red/30 bg-accent-red/5'
          : accent === 'purple'
            ? 'ring-accent-purple/30 bg-accent-purple/5'
            : 'ring-bg-border bg-bg-elevated/40';
  const valueCls =
    accent === 'green'
      ? 'text-accent-green'
      : accent === 'amber'
        ? 'text-accent-amber'
        : accent === 'red'
          ? 'text-accent-red'
          : accent === 'purple'
            ? 'text-accent-purple'
            : 'text-white';
  return (
    <div className={`rounded-lg p-3 ring-1 transition-all ${ringCls}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-lg font-bold ${valueCls}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}
