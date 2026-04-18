import { useEffect, useState } from 'react';
import { observeInstall, getInstalledVersion, ping } from '../services/extensionBridge';

/**
 * ExtensionStatusBadge — pill nhỏ hiển thị trạng thái cài Extension.
 * Tự cập nhật real-time qua MutationObserver khi extension được cài.
 */
export function ExtensionStatusBadge() {
  const [installed, setInstalled] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [pinged, setPinged] = useState(false);

  useEffect(() => {
    const unsub = observeInstall((ok) => {
      setInstalled(ok);
      setVersion(getInstalledVersion());
    });
    // Ping song song để chắc chắn extension còn sống
    ping()
      .then((res) => setPinged(res.ok))
      .catch(() => setPinged(false));
    return unsub;
  }, []);

  if (installed && pinged) {
    return (
      <span className="badge bg-accent-green/15 text-accent-green ring-1 ring-accent-green/30">
        <span className="mr-1">●</span>
        Extension v{version} đã cài
      </span>
    );
  }

  if (installed && !pinged) {
    return (
      <span className="badge bg-accent-amber/15 text-accent-amber ring-1 ring-accent-amber/30">
        <span className="mr-1">⚠</span>
        Extension cài rồi — cần reload tab
      </span>
    );
  }

  return (
    <a
      href="https://chrome.google.com/webstore/"
      target="_blank"
      rel="noreferrer"
      className="badge bg-bg-elevated text-slate-300 ring-1 ring-bg-border hover:bg-brand-500/15 hover:text-brand-300 hover:ring-brand-500/30 transition-colors"
    >
      <span className="mr-1">🧩</span>
      Cài Extension để sync
    </a>
  );
}

export default ExtensionStatusBadge;
