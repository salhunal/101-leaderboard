"use client";
import { useState, useEffect } from "react";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { calcScores } from "@/lib/scoring";

const RANK_LABELS = { 1: "1.", 2: "2.", 3: "3.", 4: "4.", 5: "5." };
const RANK_COLORS = {
  1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c2f", 4: "#475569", 5: "#334155",
};

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
  const st = active ? scores[active] : null;
  const wr = st && st.total > 0 ? Math.round((st.wins / st.total) * 100) : 0;
  const recent = st ? st.recentRanks.slice(-6).reverse() : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">İstatistikler</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.name)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: active === p.name ? "#6366f1" : "var(--surface)",
              color: active === p.name ? "#fff" : "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!st || games.length === 0 ? (
        <p className="text-center mt-10" style={{ color: "var(--muted)" }}>
          Henüz oyun girilmedi.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Toplam Puan", value: st.pts, color: "#6366f1" },
              { label: "Oyun Sayısı", value: st.total, color: "var(--text)" },
              { label: "Birincilik 🥇", value: st.wins, color: "#f59e0b" },
              { label: "Sonunculuk 😅", value: st.lasts, color: "#ef4444" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{s.label}</p>
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm" style={{ color: "var(--muted)" }}>Kazanma oranı</p>
              <p className="font-semibold text-sm">%{wr}</p>
            </div>
            <div className="h-2 rounded-full" style={{ background: "var(--surface2)" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${wr}%`, background: "#6366f1" }}
              />
            </div>
          </div>

          {recent.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>Son performans</p>
              <div className="flex gap-2 flex-wrap">
                {recent.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                    style={{ background: "var(--surface2)" }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: RANK_COLORS[r] }} />
                    {RANK_LABELS[r] || `${r}.`}
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
