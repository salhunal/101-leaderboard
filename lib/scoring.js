export const PLAYERS = ["Salih", "Ahmet", "Mehmet", "Ali"];
export const POINTS_MAP = { 1: 3, 2: 2, 3: 1, 4: 0 };

export function calcScores(games) {
  const scores = {};
  PLAYERS.forEach((p) => {
    scores[p] = { pts: 0, wins: 0, lasts: 0, total: 0, recentRanks: [] };
  });

  games.forEach((game) => {
    game.players.forEach((p) => {
      if (!scores[p.name]) return;
      scores[p.name].pts += POINTS_MAP[p.rank] ?? 0;
      scores[p.name].total += 1;
      if (p.rank === 1) scores[p.name].wins += 1;
      if (p.rank === 4) scores[p.name].lasts += 1;
      scores[p.name].recentRanks.push(p.rank);
    });
  });

  return scores;
}

export function sortedLeaderboard(games) {
  const scores = calcScores(games);
  return PLAYERS.slice()
    .sort((a, b) => scores[b].pts - scores[a].pts)
    .map((name, i) => ({ name, rank: i + 1, ...scores[name] }));
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}
