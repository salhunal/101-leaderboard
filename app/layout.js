import './globals.css';
import BottomNav from '@/components/BottomNav';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import SiteGuard from '@/components/SiteGuard';

export const metadata = {
  title: '101 Leaderboard',
  description: 'Arkadaş grubu 101 sıralama uygulaması',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="101" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
`,
          }}
        />
      </head>
      <body className="pb-20">
        <SiteGuard>
          <main className="max-w-lg mx-auto px-4 pt-6">{children}</main>
          <PWAInstallBanner />
          <BottomNav />
        </SiteGuard>
      </body>
    </html>
  );
}
