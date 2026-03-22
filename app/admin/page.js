'use client';
import { useGames } from '@/hooks/useGames';
import { usePlayers } from '@/hooks/usePlayers';
import { useSeasons } from '@/hooks/useSeasons';
import { useSettings } from '@/hooks/useSettings';
import { sortedLeaderboard, calcBadges, calcScores } from '@/lib/scoring';
import { useState } from 'react';

const RANK_STYLES = {
  1: { bg: '#451a03', color: '#f59e0b', badge: '🥇' },
  2: { bg: '#1e293b', color: '#94a3b8', badge: '🥈' },
  3: { bg: '#2c1810', color: '#cd7c2f', badge: '🥉' },
};

function getPhotoURL(name) {
  const slug = name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s/g, '');
  return `/photos/${slug}.png`;
}

function getMonthGames(games) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return games.filter((g) => g.date && g.date.startsWith(ym));
}

export default function LeaderboardPage() {
  const { seasons } = useSeasons();
  const [selectedSeason, setSelectedSeason] = useState('all');
  const { games, loading: gLoading } = useGames(selectedSeason === 'all' ? null : selectedSeason);
  const { players, loading: pLoading } = usePlayers();
  const { settings } = useSettings();

  if (gLoading || pLoading)
    return (
      <p className="text-center mt-20" style={{ color: 'var(--muted)' }}>
        Yükleniyor...
      </p>
    );

  const playerNames = players.map((p) => p.name);
  const board = sortedLeaderboard(playerNames, games);
  const scores = calcScores(playerNames, games);

  const monthGames = getMonthGames(games);
  const monthScores = calcScores(playerNames, monthGames);
  const monthBoard = playerNames
    .filter((n) => monthScores[n]?.total > 0)
    .sort((a, b) => monthScores[a].pts - monthScores[b].pts);
  const monthLoser = monthBoard[0];
  const monthWinner = monthBoard[monthBoard.length - 1];
  const monthName = new Date().toLocaleString('tr-TR', { month: 'long' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{settings.appName}</h1>
          <p style={{ color: 'var(--muted)' }} className="text-sm mt-0.5">
            {games.length} oyun oynandı
          </p>
        </div>
        <span className="text-3xl">⭐</span>
      </div>

      {monthGames.length > 0 && monthWinner && monthLoser && monthWinner !== monthLoser && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className="rounded-2xl p-4 flex flex-col items-center text-center"
            style={{
              background: 'linear-gradient(135deg, #451a03, #78350f)',
              border: '2px solid #f59e0b',
            }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: '#f59e0b' }}>
              {monthName.toUpperCase()} KRAL 👑
            </p>
            <img
              src={getPhotoURL(monthWinner)}
              alt={monthWinner}
              className="w-16 h-16 rounded-full object-cover mb-2"
              style={{ border: '3px solid #f59e0b' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              className="w-16 h-16 rounded-full items-center justify-center mb-2 text-2xl font-bold"
              style={{ background: '#92400e', border: '3px solid #f59e0b', display: 'none' }}
            >
              {monthWinner[0]}
            </div>
            <p className="font-bold text-sm">{monthWinner}</p>
            <p className="text-xs mt-0.5" style={{ color: '#fbbf24' }}>
              {monthScores[monthWinner]?.pts} puan
            </p>
          </div>

          <div
            className="rounded-2xl p-4 flex flex-col items-center text-center"
            style={{
              background: 'linear-gradient(135deg, #1a0505, #450a0a)',
              border: '2px solid #ef4444',
            }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: '#ef4444' }}>
              {monthName.toUpperCase()} ELEMAN 😳
            </p>
            <div className="relative">
              <img
                src={getPhotoURL(monthLoser)}
                alt={monthLoser}
                className="w-16 h-16 rounded-full object-cover mb-2"
                style={{ border: '3px solid #ef4444', filter: 'grayscale(40%)' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="w-16 h-16 rounded-full items-center justify-center mb-2 text-2xl font-bold"
                style={{ background: '#7f1d1d', border: '3px solid #ef4444', display: 'none' }}
              >
                {monthLoser[0]}
              </div>
              <span className="absolute -top-1 -right-1 text-lg">😭</span>
            </div>
            <p className="font-bold text-sm">{monthLoser}</p>
            <p className="text-xs mt-0.5" style={{ color: '#fca5a5' }}>
              {monthScores[monthLoser]?.pts} puan
            </p>
          </div>
        </div>
      )}

      {seasons.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSeason('all')}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{
              background: selectedSeason === 'all' ? 'var(--accent)' : 'var(--surface)',
              color: selectedSeason === 'all' ? '#fff' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            Tümü
          </button>
          {seasons.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeason(s.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                background: selectedSeason === s.id ? 'var(--accent)' : 'var(--surface)',
                color: selectedSeason === s.id ? '#fff' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {board.length === 0 ? (
        <div className="text-center mt-20" style={{ color: 'var(--muted)' }}>
          <p className="text-4xl mb-3">🃏</p>
          <p>Admin panelinden oyuncu ve oyun ekleyin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {board.map((player) => {
            const style = RANK_STYLES[player.rank] || {};
            const wr = player.total > 0 ? Math.round((player.wins / player.total) * 100) : 0;
            const badges = calcBadges(player.name, scores, games);
            return (
              <div
                key={player.name}
                className="rounded-2xl p-4"
                style={{
                  background: style.bg || 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getPhotoURL(player.name)}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: `2px solid ${style.color || 'var(--border)'}` }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-full items-center justify-center text-lg font-bold"
                      style={{
                        background: 'var(--surface2)',
                        color: style.color || 'var(--muted)',
                        border: `2px solid ${style.color || 'var(--border)'}`,
                        display: 'none',
                      }}
                    >
                      {style.badge || player.rank}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base">{player.name}</span>
                      {player.rank === 1 && <span>👑</span>}
                      {badges.map((b, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
                        >
                          {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {player.total} oyun · %{wr} · {player.wins} 🥇
                      {player.streak > 1 && (
                        <span className="ml-1 text-orange-400">🔥{player.streak}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: style.color || 'var(--text)' }}
                    >
                      {player.pts}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      puan
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full" style={{ background: 'var(--surface2)' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${wr}%`,
                      background: 'var(--accent)',
                      transition: 'width 0.5s',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
