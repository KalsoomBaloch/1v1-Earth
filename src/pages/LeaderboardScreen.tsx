import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { useGameState } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';
import { playClick, playMusicLeaderboard } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';

interface LeaderboardEntry {
  country_code: string; wins: number; losses: number; total: number;
}

function loadLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem('leaderboard_data');
  const lb: Record<string, { wins: number; losses: number }> = raw ? JSON.parse(raw) : {};
  const defaults: Record<string, { wins: number; losses: number }> = {
    US: { wins: 142, losses: 58 }, GB: { wins: 98, losses: 42 }, DE: { wins: 87, losses: 39 },
    JP: { wins: 76, losses: 34 }, BR: { wins: 65, losses: 30 }, FR: { wins: 54, losses: 26 },
    IN: { wins: 48, losses: 22 }, CA: { wins: 41, losses: 19 }, AU: { wins: 35, losses: 15 },
    KR: { wins: 29, losses: 11 },
  };
  const merged: Record<string, { wins: number; losses: number }> = {};
  for (const [code, val] of Object.entries(defaults)) merged[code] = { ...val };
  for (const [code, val] of Object.entries(lb)) {
    if (merged[code]) { merged[code].wins += val.wins; merged[code].losses += val.losses; }
    else merged[code] = { ...val };
  }
  return Object.entries(merged)
    .map(([country_code, { wins, losses }]) => ({ country_code, wins, losses, total: wins + losses }))
    .sort((a, b) => b.wins - a.wins);
}

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const playerCountry = useGameState((s) => s.countryCode);
  const [entries] = useState<LeaderboardEntry[]>(loadLeaderboard);
  const [nextReset, setNextReset] = useState('');
  const playerRank = entries.findIndex(e => e.country_code === playerCountry) + 1;

  useEffect(() => {
    playMusicLeaderboard();
    updateResetTimer();
    const timerInterval = setInterval(updateResetTimer, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  function updateResetTimer() {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);
    const diff = nextMonday.getTime() - now.getTime();
    setNextReset(`${Math.floor(diff / 86400000)}d ${Math.floor((diff % 86400000) / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`);
  }

  const medalGlow = ['box-glow-gold', 'box-glow-cyan', 'box-glow-cyan'];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-8 max-w-[420px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { playClick(); navigate('/'); }} className="text-primary/70 hover:text-primary transition-colors font-display text-sm tracking-widest">
            ← BACK
          </button>
          <h1 className="text-2xl font-display font-bold text-glow-cyan tracking-wider">🏆 LEADERBOARD</h1>
          <div className="w-16" />
        </div>

        {playerRank > 0 && (
          <div className="text-center mb-4 glass-card-strong rounded-xl p-3 box-glow-cyan">
            <p className="text-[10px] text-primary/60 font-display tracking-[0.15em]">YOUR RANK</p>
            <p className="text-3xl font-black font-mono text-primary text-glow-cyan">#{playerRank}</p>
          </div>
        )}

        <div className="text-center mb-6 glass-card rounded-xl p-3">
          <p className="text-[10px] text-primary/60 font-display tracking-[0.15em]">WEEKLY RESET IN</p>
          <p className="text-lg font-bold font-mono text-primary">{nextReset}</p>
        </div>

        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isPlayer = entry.country_code === playerCountry;
            return (
              <div
                key={entry.country_code}
                className={cn(
                  "flex items-center gap-4 rounded-xl p-4 transition-all",
                  isPlayer ? "glass-card-strong box-glow-cyan" : "glass-card hover:box-glow-cyan",
                  i < 3 && medalGlow[i],
                )}
              >
                <span className={cn(
                  "text-xl w-8 text-center font-display font-bold",
                  i === 0 && "text-glow-gold",
                )}>
                  {i < 3 ? medals[i] : <span className="text-sm text-muted-foreground font-mono">#{i + 1}</span>}
                </span>
                <CountryFlag code={entry.country_code} size="sm" />
                <span className={cn(
                  "flex-1 font-semibold font-display tracking-wider",
                  isPlayer && "text-primary text-glow-cyan"
                )}>
                  {countryName(entry.country_code)}
                </span>
                <div className="text-right">
                  <span className="font-bold font-mono text-primary">{entry.wins}W</span>
                  <span className="text-muted-foreground font-mono text-sm ml-1">/ {entry.total}G</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
