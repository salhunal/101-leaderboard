"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { useSeasons } from "@/hooks/useSeasons";
import { useSettings } from "@/hooks/useSettings";
import { todayISO } from "@/lib/scoring";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

const ACCENT_COLORS = [
  { label: "İndigo", value: "#6366f1" },
  { label: "Mor", value: "#8b5cf6" },
  { label: "Mavi", value: "#3b82f6" },
  { label: "Yeşil", value: "#10b981" },
  { label: "Turuncu", value: "#f97316" },
  { label: "Kırmızı", value: "#ef4444" },
  { label: "Pembe", value: "#ec4899" },
];

function AdminContent() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { games } = useGames();
  const { players, addPlayer, removePlayer } = usePlayers();
  const { seasons, addSeason } = useSeasons();
  const { settings, saveSettings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");

  const [tab, setTab] = useState("game");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newSeasonName, setNewSeasonName] = useState("");
  const [appName, setAppName] = useState(settings.appName);
  const [accentColor, setAccentColor] = useState(settings.accentColor);

  const [date, setDate] = useState(todayISO());
  const [selectedSeason, setSelectedSeason] = useState("");
  const [ranks, setRanks] = useState({});
  const [note, setNote] = useState("");

  useEffect(() => {
    setAppName(settings.appName);
    setAccentColor(settings.accentColor);
  }, [settings]);

  useEffect(() => {
    if (players.length > 0 && Object.keys(ranks).length === 0) {
      setRanks(players.reduce((acc, p, i) => ({ ...acc, [p.name]: i + 1 }), {}));
    }
  }, [players]);

  useEffect(() => {
    if (editId && games.length > 0 && players.length > 0) {
      const game = games.find((g) => g.id === editId);
      if (game) {
        setDate(game.date);
        setNote(game.note || "");
        setSelectedSeason(game.seasonId || "");
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
    const gamePlayers = players.map((p) => ({ name: p.name, rank: Number(ranks[p.name]) }));
    try {
      if (editId) {
        await updateDoc(doc(db, "games", editId), { date, players: gamePlayers, note, seasonId: selectedSeason || null });
        showToast("Oyun güncellendi ✓");
        router.push("/history");
      } else {
        await addDoc(collection(db, "games"), { date, players: gamePlayers, note, seasonId: selectedSeason || null, createdAt: serverTimestamp() });
        showToast("Oyun eklendi ✓");
        setRanks(players.reduce((acc, p, i) => ({ ...acc, [p.name]: i + 1 }), {}));
        setDate(todayISO());
        setNote("");
      }
    } catch (err) {
      showToast("Hata: " + err.message);
    }
    setSaving(false);
  }

  async function handleSaveSettings() {
    await saveSettings({ appName, accentColor });
    document.documentElement.style.setProperty("--accent", accentColor);
    showToast("Ayarlar kaydedildi ✓");
  }

  if (authLoading) return <p className="text-center mt-20" style={{ color: "var(--muted)" }}>Yükleniyor...</p>;

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Admin Girişi</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          {authError && <p className="text-sm" style={{ color: "#fca5a5" }}>{authError}</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
            Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: "game", label: "Oyun" },
    { id: "players", label: "Oyuncular" },
    { id: "seasons", label: "Sezonlar" },
    { id: "settings", label: "Ayarlar" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button onClick={() => signOut(auth)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
          Çıkış
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
            style={{ background: tab === t.id ? "var(--accent)" : "var(--surface)", color: tab === t.id ? "#fff" : "var(--muted)", border: "1px solid var(--border)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "game" && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>{editId ? "Oyunu Düzenle" : "Yeni Oyun"}</p>
          <div className="mb-4">
            <label className="text-xs block mb-2" style={{ color: "var(--muted)" }}>Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          {seasons.length > 0 && (
            <div className="mb-4">
              <label className="text-xs block mb-2" style={{ color: "var(--muted)" }}>Sezon (opsiyonel)</label>
              <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                <option value="">Sezon yok</option>
                {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="mb-4">
            <label className="text-xs block mb-3" style={{ color: "var(--muted)" }}>Sıralama</label>
            <div className="flex flex-col gap-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className="flex-1 font-medium">{player.name}</span>
                  <select value={ranks[player.name] || 1} onChange={(e) => setRanks((prev) => ({ ...prev, [player.name]: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    {players.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}. sıra</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs block mb-2" style={{ color: "var(--muted)" }}>Not / Yorum (opsiyonel)</label>
            <input type="text" placeholder="Bu oyun hakkında bir şey yaz..." value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl font-semibold"
            style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oyunu Kaydet"}
          </button>
          {editId && (
            <button onClick={() => router.push("/history")} className="w-full py-3 rounded-xl text-sm mt-2"
              style={{ background: "var(--surface2)", color: "var(--muted)" }}>İptal</button>
          )}
        </div>
      )}

      {tab === "players" && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>Oyuncu Listesi</p>
          <div className="flex flex-col gap-2 mb-5">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--surface2)" }}>
                <span className="font-medium">{p.name}</span>
                <button onClick={() => removePlayer(p.id)} className="text-xs px-3 py-1 rounded-lg" style={{ background: "#450a0a", color: "#fca5a5" }}>Sil</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Yeni oyuncu adı" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { addPlayer(newPlayerName.trim()); setNewPlayerName(""); showToast("Oyuncu eklendi ✓"); } }}
              className="flex-1 px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <button onClick={() => { addPlayer(newPlayerName.trim()); setNewPlayerName(""); showToast("Oyuncu eklendi ✓"); }}
              className="px-5 py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--accent)", color: "#fff" }}>Ekle</button>
          </div>
        </div>
      )}

      {tab === "seasons" && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>Sezonlar</p>
          <div className="flex flex-col gap-2 mb-5">
            {seasons.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>Henüz sezon yok.</p>}
            {seasons.map((s) => (
              <div key={s.id} className="px-4 py-3 rounded-xl" style={{ background: "var(--surface2)" }}>
                <span className="font-medium">{s.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Sezon adı (ör: Ocak 2026)" value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { addSeason(newSeasonName.trim()); setNewSeasonName(""); showToast("Sezon eklendi ✓"); } }}
              className="flex-1 px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <button onClick={() => { addSeason(newSeasonName.trim()); setNewSeasonName(""); showToast("Sezon eklendi ✓"); }}
              className="px-5 py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--accent)", color: "#fff" }}>Ekle</button>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-4 font-medium" style={{ color: "var(--muted)" }}>Uygulama Ayarları</p>
          <div className="mb-4">
            <label className="text-xs block mb-2" style={{ color: "var(--muted)" }}>Uygulama Adı</label>
            <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div className="mb-5">
            <label className="text-xs block mb-3" style={{ color: "var(--muted)" }}>Tema Rengi</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button key={c.value} onClick={() => setAccentColor(c.value)}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: c.value, border: accentColor === c.value ? "3px solid #fff" : "3px solid transparent" }}>
                  {accentColor === c.value && <span className="text-white text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSaveSettings} className="w-full py-3 rounded-xl font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
            Kaydet
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-medium z-50"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return <Suspense><AdminContent /></Suspense>;
}
