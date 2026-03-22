export const POINTS_MAP = (playerCount) => {
  const map = {};
  for (let i = 1; i <= playerCount; i++) {
    map[i] = playerCount - i;
  }
  return map;
};

export function calcScores(players, games) {
  const scores = {};
  players.forEach((p) => {
    scores[p] = { pts: 0, wins: 0, lasts: 0, total: 0, recentRanks: [] };
  });

  games.forEach((game) => {
    const pm = POINTS_MAP(game.players.length);
    game.players.forEach((p) => {
      if (!scores[p.name]) return;
      scores[p.name].pts += pm[p.rank] ?? 0;
      scores[p.name].total += 1;
      if (p.rank === 1) scores[p.name].wins += 1;
      if (p.rank === game.players.length) scores[p.name].lasts += 1;
      scores[p.name].recentRanks.push(p.rank);
    });
  });

  return scores;
}

export function sortedLeaderboard(players, games) {
  const scores = calcScores(players, games);
  return players
    .slice()
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
