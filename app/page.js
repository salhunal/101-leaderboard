"use client";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { useSeasons } from "@/hooks/useSeasons";
import { useSettings } from "@/hooks/useSettings";
import { sortedLeaderboard, calcBadges, calcScores } from "@/lib/scoring";
import { useState } from "react";

const RANK_STYLES = {
  1: { bg: "#451a03", color: "#f59e0b", badge: "🥇" },
  2: { bg: "#1e293b", color: "#94a3b8", badge: "🥈" },
  3: { bg: "#2c1810", color: "#cd7c2f", badge: "🥉" },
};

export default function LeaderboardPage() {
  const { seasons } = useSeasons();
  const [selectedSeason, setSelectedSeason] = useState("all");
  const { games, loading: gLoading } = useGames(selectedSeason === "all" ? null : selectedSeason);
  const { players, loading: pLoading } = usePlayers();
  const { settings } = useSettings();

  if (gLoading || pLoading)
    return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  const playerNames = players.map((p) => p.name);
  const board = sortedLeaderboard(playerNames, games);
  const scores = calcScores(playerNames, games);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{settings.appName}</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-0.5">{games.length} oyun oynandı</p>
        </div>
        <span className="text-3xl">⭐</span>
      </div>

      {seasons.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSeason("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{
              background: selectedSeason === "all" ? "var(--accent)" : "var(--surface)",
              color: selectedSeason === "all" ? "#fff" : "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            Tümü
          </button>
          {seasons.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeason(s.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                background: selectedSeason === s.id ? "var(--accent)" : "var(--surface)",
                color: selectedSeason === s.id ? "#fff" : "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {board.length === 0 ? (
        <div className="text-center mt-20" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">🃏</p>
          <p>Admin panelinden oyuncu ve oyun ekleyin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {board.map((player) => {
            const style = RANK_STYLES[player.rank] || {};
            const wr = player.total > 0 ? Math.round((player.wins / player.total) * 100) : 0;
            const badges = calcBadges(player.name, scores, games);
            return (
              <div
                key={player.name}
                className="rounded-2xl p-4"
                style={{ background: style.bg || "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl w-10 text-center">{style.badge || player.rank}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{player.name}</span>
                      {player.rank === 1 && <span>👑</span>}
                      {badges.map((b, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {player.total} oyun · %{wr} kazanma · {player.wins} 🥇
                      {player.streak > 1 && <span className="ml-1 text-orange-400">🔥{player.streak}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: style.color || "var(--text)" }}>{player.pts}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>puan</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full" style={{ background: "var(--surface2)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${wr}%`, background: "var(--accent)", transition: "width 0.5s" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
