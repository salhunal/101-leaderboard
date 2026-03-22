"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";

export default function SiteGuard({ children }) {
  const { settings, loading } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("site-unlocked") === "1") setUnlocked(true);
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0f172a" }}>
      <div className="text-4xl animate-pulse">🃏</div>
    </div>
  );

  // Şifre ayarlanmamışsa direkt geç
  if (!settings.sitePassword) return children;
  if (unlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (input === settings.sitePassword) {
      sessionStorage.setItem("site-unlocked", "1");
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setInput("");
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6" style={{ background: "#0f172a" }}>
      <div className="text-6xl mb-6">🃏</div>
      <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "#f1f5f9" }}>
        {settings.appName}
      </h1>
      <p className="text-sm mb-8 text-center" style={{ color: "#94a3b8" }}>
        Girmek için şifreyi gir
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3"
        style={{ animation: shaking ? "shake 0.4s" : "none" }}>
        <input
          type="password"
          placeholder="Şifre"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          className="w-full px-4 py-4 rounded-2xl text-center text-lg font-bold tracking-widest"
          style={{
            background: "#1e293b",
            border: `2px solid ${error ? "#ef4444" : "#334155"}`,
            color: "#f1f5f9",
            outline: "none",
          }}
        />
        {error && <p className="text-center text-sm" style={{ color: "#ef4444" }}>Yanlış şifre! 🙅</p>}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl font-bold text-lg"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Gir
        </button>
      </form>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}
