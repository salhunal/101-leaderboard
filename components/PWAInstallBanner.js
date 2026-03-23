'use client';
import { useEffect, useState } from 'react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) {
      setDismissed(true);
      return;
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setDismissed(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    if (ios) {
      setIsIOS(true);
      setShowIOS(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1');
    setDismissed(true);
    setShowIOS(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem('pwa-dismissed', '1');
    setDeferredPrompt(null);
    setDismissed(true);
  }

  if (dismissed) return null;

  // iOS — küçük banner
  if (showIOS) {
    return (
      <div
        className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: '#1e293b', border: '1px solid #6366f1' }}
      >
        <span className="text-xl">📲</span>
        <p className="flex-1 text-xs" style={{ color: '#94a3b8' }}>
          <strong style={{ color: '#f1f5f9' }}>Uygulamayı ekle:</strong> Paylaş → Ana Ekrana Ekle
        </p>
        <button
          onClick={dismiss}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: '#334155', color: '#94a3b8' }}
        >
          ✕
        </button>
      </div>
    );
  }

  // Android — sadece küçük download butonu sağ altta
  if (deferredPrompt) {
    return (
      <button
        onClick={install}
        className="fixed z-50 flex items-center justify-center rounded-full shadow-lg"
        style={{
          bottom: '72px',
          right: '16px',
          width: '44px',
          height: '44px',
          background: '#6366f1',
          border: 'none',
        }}
        title="Uygulamayı yükle"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    );
  }

  return null;
}
