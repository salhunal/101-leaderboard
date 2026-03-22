"use client";
import { useGames } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/scoring";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

const RANK_COLORS = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7c2f", 4: "#475569" };
const RANK_LABELS = { 1: "1.", 2: "2.", 3: "3.", 4: "Son" };

export default function HistoryPage() {
  const { games, loading } = useGames();
  const { isAdmin } = useAuth();

  async function handleDelete(id) {
    if (!confirm("Bu oyunu silmek istediğine emin misin?")) return;
    await deleteDoc(doc(db, "games", id));
  }

  if (loading) return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Oyun Geçmişi</h1>

      {games.length === 0 ? (
        <p className="text-center mt-10" style={{ color: "var(--muted)" }}>Henüz oyun girilmedi.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((game) => {
            const sorted = [...game.players].sort((a, b) => a.rank - b.rank);
            return (
              <div
                key={game.id}
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm mb-3 font-medium" style={{ color: "var(--muted)" }}>
                  📅 {formatDate(game.date)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sorted.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                      style={{ background: "var(--surface2)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: RANK_COLORS[p.rank] }}
                      />
                      <span style={{ color: RANK_COLORS[p.rank] }} className="font-medium">
                        {RANK_LABELS[p.rank]}
                      </span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <Link
                      href={`/admin?edit=${game.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "var(--surface2)", color: "var(--muted)" }}
                    >
                      ✏️ Düzenle
                    </Link>
                    <button
                      onClick={() => handleDelete(game.id)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "#450a0a", color: "#fca5a5" }}
                    >
                      🗑 Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
