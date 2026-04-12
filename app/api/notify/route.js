import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FIXED_POINTS = { 1: 3, 2: 2, 3: 1, 4: 0 };

async function getLeader() {
  const gamesSnap = await getDocs(query(collection(db, 'games'), orderBy('date', 'desc')));
  const playersSnap = await getDocs(query(collection(db, 'players'), orderBy('createdAt', 'asc')));
  const games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const players = playersSnap.docs.map((d) => d.data().name);

  const scores = {};
  players.forEach((p) => {
    scores[p] = { pts: 0, total: 0, wins: 0, lasts: 0 };
  });
  games.forEach((game) => {
    game.players.forEach((p) => {
      if (!scores[p.name]) return;
      scores[p.name].pts += FIXED_POINTS[p.rank] ?? 0;
      scores[p.name].total += 1;
      if (p.rank === 1) scores[p.name].wins += 1;
      if (p.rank === 4) scores[p.name].lasts += 1;
    });
  });

  const board = players
    .filter((name) => scores[name].total >= 3)
    .sort((a, b) => {
      const avgA = scores[a].total > 0 ? scores[a].pts / scores[a].total : 0;
      const avgB = scores[b].total > 0 ? scores[b].pts / scores[b].total : 0;
      return avgB - avgA;
    })
    .map((name, i) => ({
      name,
      rank: i + 1,
      avg: Math.round((scores[name].pts / scores[name].total) * 10) / 10,
      ...scores[name],
    }));

  return { board, totalGames: games.length };
}

async function pinMessage(messageId) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/pinChatMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, message_id: messageId, disable_notification: true }),
  });
}

export async function POST(req) {
  try {
    const { players, date } = await req.json();
    const medals = ['🥇', '🥈', '🥉', '4.'];
    const sorted = [...players].sort((a, b) => a.rank - b.rank);

    const { board, totalGames } = await getLeader();

    // Maç sonucu + güncel durum tek mesajda
    let msg = `🃏 <b>Yeni Maç!</b> (${date})\n\n`;
    sorted.forEach((p, i) => {
      msg += `${medals[i] || `${i + 1}.`} ${p.name}\n`;
    });

    msg += `\n─────────────────\n📌 <b>Güncel Durum</b>\n\n`;

    if (board.length > 0) {
      board.forEach((p, i) => {
        msg += `${medals[i] || `${i + 1}.`} ${p.name} — <b>${p.avg}</b> ort\n`;
      });
      msg += `\n🎮 Toplam ${totalGames} oyun oynandı`;
    } else {
      msg += 'Henüz yeterli oyun yok.';
    }

    // Mesajı gönder
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'HTML' }),
    });
    const data = await res.json();

    // Mesajı sabitle
    if (data.ok && data.result?.message_id) {
      await pinMessage(data.result.message_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
