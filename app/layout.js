import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "101 Leaderboard",
  description: "Arkadaş grubu 101 sıralama uygulaması",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="pb-20">
        <main className="max-w-lg mx-auto px-4 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
