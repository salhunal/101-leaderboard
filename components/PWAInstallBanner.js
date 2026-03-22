"use client";
import { useEffect, useState } from "react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Daha önce kapatmışsa gösterme
    if (localStorage.getItem("pwa-dismissed")) return;
    // Zaten yüklüyse gösterme
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    if (ios) {
      setIsIOS(true);
      setShowIOS(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-dismissed", "1");
    setShow(false);
    setShowIOS(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem("pwa-dismissed", "1");
    setShow(false);
    setDeferredPrompt(null);
  }

  if (!show && !showIOS) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3"
      style={{ background: "#1e293b", border: "1px solid #6366f1", boxShadow: "0 0 20px #6366f133" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0f172a" }}>
        <span className="text-xl">📱</span>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Uygulamayı yükle</p>
        {isIOS ? (
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            Safari'de <strong>Paylaş</strong> → <strong>Ana Ekrana Ekle</strong>
          </p>
        ) : (
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            Telefona uygulama olarak ekle
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {!isIOS && (
          <button
            onClick={install}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            Ekle
          </button>
        )}
        <button
          onClick={dismiss}
          className="px-3 py-1.5 rounded-xl text-xs"
          style={{ background: "#334155", color: "#94a3b8" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
