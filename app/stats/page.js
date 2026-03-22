"use client";
import { useState, useEffect } from "react";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { calcScores, calcBadges, sortedLeaderboard } from "@/lib/scoring";
import { formatDate } from "@/lib/scoring";

const RANK_COLORS = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c2f", 4: "#475569", 5: "#334155" };

export default function StatsPage() {
  const { games, loading: gLoading } = useGames();
  const { players, loading: pLoading } = usePlayers();
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (players.length > 0 && !active) setActive(players[0].name);
  }, [players]);

  if (gLoading || pLoading)
    return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  const playerNames = players.map((p) => p.name);
  const scores = calcScores(playerNames, games);
  const board = sortedLeaderboard(playerNames, games);
  const st = active ? scores[active] : null;
  const wr = st && st.total > 0 ? Math.round((st.wins / st.total) * 100) : 0;
  const recent = st ? st.recentRanks.slice(-8).reverse() : [];
  const badges = active ? calcBadges(active, scores, games) : [];

  // Puan trend data - son 10 oyun
  const playerGames = games
    .filter((g) => g.players.some((p) => p.name === active))
    .slice(0, 10)
    .reverse();

  let cumPts = 0;
  const trendData = playerGames.map((g) => {
    const p = g.players.find((x) => x.name === active);
    cumPts += g.players.length - (p?.rank || g.players.length);
    return { date: formatDate(g.date), pts: cumPts };
  });

  const maxTrendPts = Math.max(...trendData.map((d) => d.pts), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">İstatistikler</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.name)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
            style={{
              background: active === p.name ? "var(--accent)" : "var(--surface)",
              color: active === p.name ? "#fff" : "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!st || games.length === 0 ? (
        <p className="text-center mt-10" style={{ color: "var(--muted)" }}>Henüz oyun girilmedi.</p>
      ) : (
        <>
          {badges.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {badges.map((b, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Toplam Puan", value: st.pts, color: "var(--accent)" },
              { label: "Oyun Sayısı", value: st.total, color: "var(--text)" },
              { label: "Birincilik 🥇", value: st.wins, color: "#f59e0b" },
              { label: "Sonunculuk 😅", value: st.lasts, color: "#ef4444" },
              { label: "Max Streak 🔥", value: st.maxStreak, color: "#f97316" },
              { label: "Şu an streak", value: st.streak, color: st.streak > 0 ? "#f97316" : "var(--muted)" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{s.label}</p>
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Kazanma oranı</p>
              <p className="font-bold" style={{ color: "var(--accent)" }}>%{wr}</p>
            </div>
            <div className="h-2 rounded-full" style={{ background: "var(--surface2)" }}>
              <div className="h-2 rounded-full" style={{ width: `${wr}%`, background: "var(--accent)", transition: "width 0.5s" }} />
            </div>
          </div>

          {trendData.length > 1 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-medium mb-3">Puan trendi</p>
              <div className="flex items-end gap-1 h-20">
                {trendData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${Math.max(8, (d.pts / maxTrendPts) * 70)}px`,
                        background: "var(--accent)",
                        opacity: 0.6 + (i / trendData.length) * 0.4,
                      }}
                    />
                    <span className="text-xs" style={{ color: "var(--muted)", fontSize: "10px" }}>{d.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-medium mb-3">Son performans</p>
              <div className="flex gap-2 flex-wrap">
                {recent.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm" style={{ background: "var(--surface2)" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: RANK_COLORS[r] || "#475569" }} />
                    {r}.
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
