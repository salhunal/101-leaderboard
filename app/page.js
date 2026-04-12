'use client';
import { useGames } from '@/hooks/useGames';
import { usePlayers } from '@/hooks/usePlayers';
import { useSettings } from '@/hooks/useSettings';
import { sortedLeaderboard, calcBadges, calcScores } from '@/lib/scoring';
import { useState, useMemo } from 'react';

const RANK_STYLES = {
  1: { bg: '#451a03', color: '#f59e0b', badge: '🥇' },
  2: { bg: '#1e293b', color: '#94a3b8', badge: '🥈' },
  3: { bg: '#2c1810', color: '#cd7c2f', badge: '🥉' },
};

function Avatar({ name, photoURL, sizePx = 48, borderColor = 'var(--border)', extraStyle = {} }) {
  const [err, setErr] = useState(false);
  const base = {
    width: sizePx,
    height: sizePx,
    minWidth: sizePx,
    minHeight: sizePx,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: `2px solid ${borderColor}`,
    ...extraStyle,
  };
  if (photoURL && !err)
    return <img src={photoURL} alt={name} style={base} onError={() => setErr(true)} />;
  return (
    <div
      style={{
        ...base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface2)',
        color: borderColor,
        fontWeight: 'bold',
        fontSize: sizePx * 0.4,
      }}
    >
      {name[0]}
    </div>
  );
}

function getMonthYearLabel(date) {
  const [y, m] = date.split('-');
  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  return `${monthNames[parseInt(m) - 1]} ${y}`;
}

export default function LeaderboardPage() {
  const { games, loading: gLoading } = useGames();
  const { players, loading: pLoading } = usePlayers();
  const { settings } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Mevcut aylları oyunlardan çıkar
  const months = useMemo(() => {
    const seen = new Set();
    const result = [];
    [...games]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((g) => {
        const ym = g.date.substring(0, 7);
        if (!seen.has(ym)) {
          seen.add(ym);
          result.push(ym);
        }
      });
    return result;
  }, [games]);

  // Seçili aya göre filtrele
  const filteredGames = useMemo(() => {
    if (selectedMonth === 'all') return games;
    return games.filter((g) => g.date.startsWith(selectedMonth));
  }, [games, selectedMonth]);

  if (gLoading || pLoading)
    return (
      <p className="text-center mt-20" style={{ color: 'var(--muted)' }}>
        Yükleniyor...
      </p>
    );

  const playerNames = players.map((p) => p.name);
  const board = sortedLeaderboard(playerNames, filteredGames);
  const scores = calcScores(playerNames, filteredGames);

  // Ayın kartları — her zaman bu ayın oyunlarından
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthGames = games.filter((g) => g.date.startsWith(thisMonth));
  const monthScores = calcScores(playerNames, monthGames);
  const monthBoard = playerNames
    .filter((n) => monthScores[n]?.total >= 1)
    .sort((a, b) => {
      const avgA = monthScores[a].total > 0 ? monthScores[a].pts / monthScores[a].total : 0;
      const avgB = monthScores[b].total > 0 ? monthScores[b].pts / monthScores[b].total : 0;
      return avgA - avgB;
    });
  const monthLoser = monthBoard[0];
  const monthWinner = monthBoard[monthBoard.length - 1];
  const monthName = now.toLocaleString('tr-TR', { month: 'long' });

  function getPhoto(name) {
    return players.find((p) => p.name === name)?.photoURL || null;
  }

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

      {/* Ayın kartları */}
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
              {monthName.toUpperCase()} KRALI 👑
            </p>
            <Avatar
              name={monthWinner}
              photoURL={getPhoto(monthWinner)}
              sizePx={64}
              borderColor="#f59e0b"
              extraStyle={{ marginBottom: '8px' }}
            />
            <p className="font-bold text-sm mt-1">{monthWinner}</p>
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
              {monthName.toUpperCase()} KÖTÜSÜ 😳
            </p>
            <div className="relative" style={{ marginBottom: '8px' }}>
              <Avatar
                name={monthLoser}
                photoURL={getPhoto(monthLoser)}
                sizePx={64}
                borderColor="#ef4444"
                extraStyle={{ filter: 'grayscale(40%)' }}
              />
              <span className="absolute -top-1 -right-1 text-lg">😭</span>
            </div>
            <p className="font-bold text-sm mt-1">{monthLoser}</p>
            <p className="text-xs mt-0.5" style={{ color: '#fca5a5' }}>
              {monthScores[monthLoser]?.pts} puan
            </p>
          </div>
        </div>
      )}

      {/* Ay filtresi */}
      {months.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedMonth('all')}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{
              background: selectedMonth === 'all' ? 'var(--accent)' : 'var(--surface)',
              color: selectedMonth === 'all' ? '#fff' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            Tümü
          </button>
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                background: selectedMonth === m ? 'var(--accent)' : 'var(--surface)',
                color: selectedMonth === m ? '#fff' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {getMonthYearLabel(m + '-01')}
            </button>
          ))}
        </div>
      )}

      {board.length === 0 ? (
        <div className="text-center mt-10" style={{ color: 'var(--muted)' }}>
          <p className="text-4xl mb-3">🃏</p>
          <p>
            {selectedMonth === 'all' ? 'Henüz yeterli oyun yok.' : 'Bu ay henüz yeterli oyun yok.'}
          </p>
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
                  <Avatar
                    name={player.name}
                    photoURL={getPhoto(player.name)}
                    sizePx={48}
                    borderColor={style.color || 'var(--border)'}
                  />
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
                      {player.total} oyun · ort {player.avg} · %{wr} · {player.wins} 🥇
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
                      {player.avg}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      ort/oyun
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
