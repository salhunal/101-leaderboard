"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { todayISO } from "@/lib/scoring";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection, addDoc, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";

function AdminContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { games } = useGames();
  const { players, addPlayer, removePlayer } = usePlayers();
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");

  const [tab, setTab] = useState("game"); // "game" | "players"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");

  const defaultRanks = () =>
    players.reduce((acc, p, i) => ({ ...acc, [p.name]: i + 1 }), {});

  const [date, setDate] = useState(todayISO());
  const [ranks, setRanks] = useState({});

  useEffect(() => {
    if (players.length > 0) setRanks(defaultRanks());
  }, [players]);

  useEffect(() => {
    if (editId && games.length > 0 && players.length > 0) {
      const game = games.find((g) => g.id === editId);
      if (game) {
        setDate(game.date);
        const r = {};
        game.players.forEach((p) => (r[p.name] = p.rank));
        setRanks(r);
      }
    }
  }, [editId, games, players]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setAuthError("Email veya şifre hatalı.");
    }
  }

  async function handleSave() {
    const rankValues = Object.values(ranks).map(Number);
    if (new Set(rankValues).size !== players.length) {
      showToast("Her oyuncunun sırası farklı olmalı!");
      return;
    }
    setSaving(true);
    const gamePlayers = players.map((p) => ({
      name: p.name,
      rank: Number(ranks[p.name]),
    }));

    try {
      if (editId) {
        await updateDoc(doc(db, "games", editId), { date, players: gamePlayers });
        showToast("Oyun güncellendi ✓");
        router.push("/history");
      } else {
        await addDoc(collection(db, "games"), {
          date,
          players: gamePlayers,
          createdAt: serverTimestamp(),
        });
        showToast("Oyun eklendi ✓");
        setRanks(defaultRanks());
        setDate(todayISO());
      }
    } catch (err) {
      showToast("Hata: " + err.message);
    }
    setSaving(false);
  }

  async function handleAddPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    await addPlayer(name);
    setNewPlayerName("");
    showToast(`${name} eklendi ✓`);
  }

  if (authLoading)
    return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Girişi</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          {authError && <p className="text-sm" style={{ color: "#fca5a5" }}>{authError}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button
          onClick={() => signOut(auth)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "var(--surface2)", color: "var(--muted)" }}
        >
          Çıkış
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {["game", "players"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: tab === t ? "#6366f1" : "var(--surface)",
              color: tab === t ? "#fff" : "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {t === "game" ? "Oyun Ekle" : "Oyuncular"}
          </button>
        ))}
      </div>

      {tab === "players" ? (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>Oyuncu Listesi</p>
          <div className="flex flex-col gap-2 mb-5">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--surface2)" }}>
                <span className="font-medium">{p.name}</span>
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-xs px-3 py-1 rounded-lg"
                  style={{ background: "#450a0a", color: "#fca5a5" }}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Yeni oyuncu adı"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              className="flex-1 px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={handleAddPlayer}
              className="px-5 py-3 rounded-xl font-semibold text-sm"
              style={{ background: "#6366f1", color: "#fff" }}
            >
              Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>
            {editId ? "Oyunu Düzenle" : "Yeni Oyun"}
          </p>
          <div className="mb-4">
            <label className="text-sm block mb-2" style={{ color: "var(--muted)" }}>Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>
          <div className="mb-5">
            <label className="text-sm block mb-3" style={{ color: "var(--muted)" }}>Sıralama</label>
            <div className="flex flex-col gap-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="flex-1 font-medium">{player.name}</span>
                  <select
                    value={ranks[player.name] || 1}
                    onChange={(e) =>
                      setRanks((prev) => ({ ...prev, [player.name]: Number(e.target.value) }))
                    }
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {players.map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}. sıra</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold"
            style={{ background: "#6366f1", color: "#fff", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oyunu Kaydet"}
          </button>
          {editId && (
            <button
              onClick={() => router.push("/history")}
              className="w-full py-3 rounded-xl text-sm mt-2"
              style={{ background: "var(--surface2)", color: "var(--muted)" }}
            >
              İptal
            </button>
          )}
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-medium z-50"
          style={{ background: "#6366f1", color: "#fff" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  );
}
