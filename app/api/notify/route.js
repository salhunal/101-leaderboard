import { NextResponse } from "next/server";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req) {
  try {
    const { players, date, leaderName, leaderAvg } = await req.json();
    const medals = ["🥇", "🥈", "🥉", "4."];
    const sorted = [...players].sort((a, b) => a.rank - b.rank);

    let msg = `🃏 <b>Yeni Maç!</b> (${date})\n\n`;
    sorted.forEach((p, i) => {
      msg += `${medals[i] || `${i + 1}.`} ${p.name}\n`;
    });

    if (leaderName) {
      msg += `\n👑 Lider: <b>${leaderName}</b> (ort ${leaderAvg})`;
    }

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: "HTML" }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
