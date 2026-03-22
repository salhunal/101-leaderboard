"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

const navItems = [
  { href: "/", label: "Sıralama", icon: "🏆" },
  { href: "/stats", label: "İstatistik", icon: "📊" },
  { href: "/head2head", label: "H2H", icon: "⚔️" },
  { href: "/history", label: "Geçmiş", icon: "📅" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.accentColor) {
      document.documentElement.style.setProperty("--accent", settings.accentColor);
    }
  }, [settings?.accentColor]);

  const items = isAdmin ? navItems : navItems.filter((i) => i.href !== "/admin");

  return (
    <nav
      style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 z-50"
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all"
            style={{ color: active ? "var(--accent)" : "var(--muted)" }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
