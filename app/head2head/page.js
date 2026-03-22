"use client";
import { useState } from "react";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { head2head } from "@/lib/scoring";
import { formatDate } from "@/lib/scoring";

export default function Head2HeadPage() {
  const { games, loading: gLoading } = useGames();
  const { players, loading: pLoading } = usePlayers();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  if (gLoading || pLoading)
    return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  const result = p1 && p2 && p1 !== p2 ? head2head(p1, p2, games) : null;
  const p1pct = result && result.total > 0 ? Math.round((result.p1wins / result.total) * 100) : 0;
  const p2pct = result && result.total > 0 ? Math.round((result.p2wins / result.total) * 100) : 0;

  const h2hGames = result
    ? games.filter((g) => g.players.some((p) => p.name === p1) && g.players.some((p) => p.name === p2))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">⚔️ Head to Head</h1>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>1. Oyuncu</label>
          <select
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="w-full px-3 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="">Seç</option>
            {players.filter((p) => p.name !== p2).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>2. Oyuncu</label>
          <select
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            className="w-full px-3 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="">Seç</option>
            {players.filter((p) => p.name !== p1).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-center flex-1">
                <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{result.p1wins}</p>
                <p className="font-semibold mt-1">{p1}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-lg font-bold" style={{ color: "var(--muted)" }}>VS</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{result.total} oyun</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold" style={{ color: "#f59e0b" }}>{result.p2wins}</p>
                <p className="font-semibold mt-1">{p2}</p>
              </div>
            </div>

            <div className="flex h-3 rounded-full overflow-hidden mb-2" style={{ background: "var(--surface2)" }}>
              <div style={{ width: `${p1pct}%`, background: "var(--accent)", transition: "width 0.5s" }} />
              <div style={{ width: `${p2pct}%`, background: "#f59e0b", transition: "width 0.5s" }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>%{p1pct}</span>
              {result.draws > 0 && <span>{result.draws} berabere</span>}
              <span>%{p2pct}</span>
            </div>
          </div>

          <p className="text-sm font-medium mb-3" style={{ color: "var(--muted)" }}>Ortak oyunlar</p>
          <div className="flex flex-col gap-2">
            {h2hGames.map((g) => {
              const r1 = g.players.find((p) => p.name === p1)?.rank;
              const r2 = g.players.find((p) => p.name === p2)?.rank;
              const winner = r1 < r2 ? p1 : r2 < r1 ? p2 : "Berabere";
              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--surface)" }}>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>{formatDate(g.date)}</span>
                  <div className="flex gap-4 text-sm">
                    <span style={{ color: r1 < r2 ? "var(--accent)" : "var(--muted)" }}>{p1}: {r1}.</span>
                    <span style={{ color: r2 < r1 ? "#f59e0b" : "var(--muted)" }}>{p2}: {r2}.</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: winner === p1 ? "var(--accent)" : winner === p2 ? "#f59e0b" : "var(--muted)" }}>
                    {winner === "Berabere" ? "=" : `${winner} ✓`}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {p1 && p2 && p1 !== p2 && result?.total === 0 && (
        <p className="text-center mt-10" style={{ color: "var(--muted)" }}>Bu iki oyuncu henüz birlikte oynamadı.</p>
      )}
    </div>
  );
}
