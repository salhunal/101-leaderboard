'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { href: '/', label: 'Sıralama', icon: '🏆' },
  { href: '/stats', label: 'İstatistik', icon: '📊' },
  { href: '/head2head', label: 'H2H', icon: '⚔️' },
  { href: '/history', label: 'Geçmiş', icon: '📅' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings?.accentColor) {
      document.documentElement.style.setProperty('--accent', settings.accentColor);
    }
  }, [settings?.accentColor]);

  const items = isAdmin ? navItems : navItems.filter((i) => i.href !== '/admin');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch {
      setError('Email veya şifre hatalı.');
    }
    setLoading(false);
  }

  return (
    <>
      {/* Admin giriş butonu - sağ üstte sabit */}
      <button
        onClick={() => (isAdmin ? signOut(auth) : setShowLogin(true))}
        className="fixed top-4 right-4 z-40 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: isAdmin ? '#166534' : 'var(--surface)',
          border: `1px solid ${isAdmin ? '#16a34a' : 'var(--border)'}`,
        }}
      >
        <span className="text-base">{isAdmin ? '🔓' : '🔒'}</span>
      </button>

      {/* Login modal */}
      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-4 px-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogin(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Admin Girişi</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              {error && (
                <p className="text-xs" style={{ color: '#fca5a5' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold mt-1"
                style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
        className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 z-40"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all"
              style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
