"use client";
import { useGames } from "@/hooks/useGames";
import { sortedLeaderboard } from "@/lib/scoring";

const RANK_STYLES = {
  1: { bg: "#451a03", color: "#f59e0b", badge: "🥇" },
  2: { bg: "#1e293b", color: "#94a3b8", badge: "🥈" },
  3: { bg: "#2c1810", color: "#cd7c2f", badge: "🥉" },
};

export default function LeaderboardPage() {
  const { games, loading } = useGames();

  if (loading) return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  const board = sortedLeaderboard(games);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">101 Leaderboard</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-0.5">{games.length} oyun oynandı</p>
        </div>
        <span className="text-3xl">⭐</span>
      </div>

      {games.length === 0 ? (
        <div className="text-center mt-20" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">🃏</p>
          <p>Henüz oyun girilmedi.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {board.map((player) => {
            const style = RANK_STYLES[player.rank] || {};
            const wr = player.total > 0 ? Math.round((player.wins / player.total) * 100) : 0;
            return (
              <div
                key={player.name}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{
                  background: style.bg || "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-2xl w-10 text-center">
                  {style.badge || player.rank}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{player.name}</span>
                    {player.rank === 1 && <span className="text-base">👑</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {player.total} oyun · %{wr} kazanma · {player.wins} birincilik
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: style.color || "var(--text)" }}
                  >
                    {player.pts}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>puan</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
