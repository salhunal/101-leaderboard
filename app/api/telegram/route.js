import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const FIXED_POINTS = { 1: 3, 2: 2, 3: 1, 4: 0 };

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function getScores() {
  const gamesSnap = await getDocs(query(collection(db, "games"), orderBy("date", "desc")));
  const playersSnap = await getDocs(query(collection(db, "players"), orderBy("createdAt", "asc")));

  const games = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const players = playersSnap.docs.map(d => d.data().name);

  const scores = {};
  players.forEach(p => { scores[p] = { pts: 0, wins: 0, lasts: 0, total: 0 }; });

  games.forEach(game => {
    game.players.forEach(p => {
      if (!scores[p.name]) return;
      scores[p.name].pts += FIXED_POINTS[p.rank] ?? 0;
      scores[p.name].total += 1;
      if (p.rank === 1) scores[p.name].wins += 1;
      if (p.rank === 4) scores[p.name].lasts += 1;
    });
  });

  const board = players
    .filter(name => scores[name].total >= 3)
    .sort((a, b) => {
      const avgA = scores[a].total > 0 ? scores[a].pts / scores[a].total : 0;
      const avgB = scores[b].total > 0 ? scores[b].pts / scores[b].total : 0;
      return avgB - avgA;
    })
    .map((name, i) => ({
      name,
      rank: i + 1,
      avg: Math.round((scores[name].pts / scores[name].total) * 10) / 10,
      ...scores[name]
    }));

  return { board, scores, games, players };
}

// Webhook - Telegram'dan gelen komutları dinler
export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.toLowerCase().trim();
    const { board, scores, games } = await getScores();

    if (text.startsWith("/puandurumu") || text.startsWith("/sıralama")) {
      if (board.length === 0) {
        await sendMessage(chatId, "Henüz yeterli oyun yok!");
      } else {
        const medals = ["🥇", "🥈", "🥉"];
        let msg = "🃏 <b>Güncel Sıralama</b>\n\n";
        board.forEach((p, i) => {
          msg += `${medals[i] || `${i + 1}.`} ${p.name} — ort <b>${p.avg}</b> (${p.total} oyun)\n`;
        });
        msg += `\n📊 Toplam ${games.length} oyun oynandı`;
        await sendMessage(chatId, msg);
      }
    }

    else if (text.startsWith("/lider")) {
      if (board.length === 0) {
        await sendMessage(chatId, "Henüz yeterli oyun yok!");
      } else {
        const lider = board[0];
        await sendMessage(chatId, `👑 Şu anki lider: <b>${lider.name}</b>\nOrtalama: ${lider.avg} puan/oyun\n${lider.total} oyun oynandı, ${lider.wins} birincilik`);
      }
    }

    else if (text.startsWith("/sonuncu")) {
      if (board.length === 0) {
        await sendMessage(chatId, "Henüz yeterli oyun yok!");
      } else {
        const sonuncu = board[board.length - 1];
        await sendMessage(chatId, `😂 Sıralamanın dibi: <b>${sonuncu.name}</b>\nOrtalama: ${sonuncu.avg} puan/oyun\n${sonuncu.lasts} kez sonuncu oldu`);
      }
    }

    else if (text.startsWith("/istatistik")) {
      const parts = message.text.split(" ");
      const name = parts.slice(1).join(" ").trim();
      if (!name) {
        await sendMessage(chatId, "Kullanım: /istatistik Salih");
      } else {
        const player = board.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (!player) {
          await sendMessage(chatId, `${name} bulunamadı veya henüz 3 oyun oynamamış.`);
        } else {
          const wr = Math.round((player.wins / player.total) * 100);
          await sendMessage(chatId,
            `📊 <b>${player.name}</b> İstatistikleri\n\n` +
            `🏆 Sıra: ${player.rank}.\n` +
            `📈 Ortalama: ${player.avg} puan/oyun\n` +
            `🎮 Oyun: ${player.total}\n` +
            `🥇 Birincilik: ${player.wins} (%${wr})\n` +
            `😅 Sonunculuk: ${player.lasts}`
          );
        }
      }
    }

    else if (text.startsWith("/yardim") || text.startsWith("/start")) {
      await sendMessage(chatId,
        "🃏 <b>Kurtlar Sofrası Bot</b>\n\n" +
        "/puandurumu — Güncel sıralama\n" +
        "/lider — Kim 1. sırada\n" +
        "/sonuncu — Sıralamanın dibi\n" +
        "/istatistik [isim] — Oyuncu istatistikleri\n" +
        "/yardim — Bu mesaj"
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false });
  }
}

// Maç girilince Telegram'a bildirim gönder
export async function sendMatchNotification(players, date) {
  const medals = ["🥇", "🥈", "🥉", "4."];
  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  let msg = `🃏 <b>Yeni Maç!</b> (${date})\n\n`;
  sorted.forEach((p, i) => {
    msg += `${medals[i] || `${i+1}.`} ${p.name}\n`;
  });

  const { board } = await getScores();
  if (board.length > 0) {
    msg += `\n👑 Lider: <b>${board[0].name}</b> (ort ${board[0].avg})`;
  }

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: "HTML" }),
  });
}
