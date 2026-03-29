export const FIXED_POINTS = { 1: 3, 2: 2, 3: 1, 4: 0 };

export function calcScores(players, games) {
  const scores = {};
  players.forEach((p) => {
    scores[p] = { pts: 0, wins: 0, lasts: 0, total: 0, recentRanks: [], streak: 0, maxStreak: 0 };
  });
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach((game) => {
    game.players.forEach((p) => {
      if (!scores[p.name]) return;
      scores[p.name].pts += FIXED_POINTS[p.rank] ?? 0;
      scores[p.name].total += 1;
      scores[p.name].recentRanks.push(p.rank);
      if (p.rank === 1) {
        scores[p.name].wins += 1;
        scores[p.name].streak += 1;
        scores[p.name].maxStreak = Math.max(scores[p.name].maxStreak, scores[p.name].streak);
      } else {
        scores[p.name].streak = 0;
      }
      if (p.rank === 4) scores[p.name].lasts += 1;
    });
  });
  return scores;
}

export function sortedLeaderboard(players, games, minGames = 3) {
  const scores = calcScores(players, games);
  return players
    .slice()
    .filter((name) => scores[name].total >= minGames)
    .sort((a, b) => {
      const avgA = scores[a].total > 0 ? scores[a].pts / scores[a].total : 0;
      const avgB = scores[b].total > 0 ? scores[b].pts / scores[b].total : 0;
      return avgB - avgA;
    })
    .map((name, i) => ({
      name,
      rank: i + 1,
      ...scores[name],
      avg:
        scores[name].total > 0 ? Math.round((scores[name].pts / scores[name].total) * 10) / 10 : 0,
    }));
}

export function calcBadges(name, scores, games) {
  const st = scores[name];
  if (!st) return [];
  const badges = [];
  const wr = st.total > 0 ? st.wins / st.total : 0;
  if (wr >= 0.5 && st.total >= 3) badges.push({ icon: '👑', label: 'Kral' });
  if (st.streak >= 3) badges.push({ icon: '🔥', label: `${st.streak} seri` });
  if (st.maxStreak >= 5) badges.push({ icon: '⚡', label: 'Efsane' });
  if (st.lasts >= 3 && st.lasts > st.wins) badges.push({ icon: '💀', label: 'Çuvallayan' });
  if (st.total >= 10) badges.push({ icon: '🎖️', label: 'Veteran' });
  const allPts = Object.values(scores).map((s) => s.pts);
  const maxPts = Math.max(...allPts);
  if (st.pts === maxPts && st.total > 0) badges.push({ icon: '🏆', label: 'Lider' });
  return badges;
}

export function head2head(p1, p2, games) {
  let p1wins = 0,
    p2wins = 0,
    draws = 0;
  const h2hGames = games.filter(
    (g) => g.players.some((p) => p.name === p1) && g.players.some((p) => p.name === p2)
  );
  h2hGames.forEach((g) => {
    const r1 = g.players.find((p) => p.name === p1)?.rank;
    const r2 = g.players.find((p) => p.name === p2)?.rank;
    if (r1 < r2) p1wins++;
    else if (r2 < r1) p2wins++;
    else draws++;
  });
  return { p1wins, p2wins, draws, total: h2hGames.length };
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}
