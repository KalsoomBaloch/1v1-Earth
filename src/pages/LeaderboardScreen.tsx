import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { useGameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { playClick, playMusicLeaderboard } from '@/lib/sounds';

interface LeaderboardEntry {
  country_code: string;
  wins: number;
  losses: number;
  total: number;
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
  for (const [code, val] of Object.entries(defaults)) {
    merged[code] = { ...val };
  }
  for (const [code, val] of Object.entries(lb)) {
    if (merged[code]) {
      merged[code].wins += val.wins;
      merged[code].losses += val.losses;
    } else {
      merged[code] = { ...val };
    }
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
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    setNextReset(`${days}d ${hours}h ${mins}m`);
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 max-w-[420px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => { playClick(); navigate('/'); }} className="text-muted-foreground">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
        <div />
      </div>

      {playerRank > 0 && (
        <div className="text-center mb-4 bg-primary/10 border border-primary/30 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Your Rank</p>
          <p className="text-2xl font-bold font-mono text-primary">#{playerRank}</p>
        </div>
      )}

      <div className="text-center mb-6 bg-card border border-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">Weekly reset in</p>
        <p className="text-lg font-bold font-mono text-primary">{nextReset}</p>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isPlayer = entry.country_code === playerCountry;
          return (
            <div
              key={entry.country_code}
              className={cn(
                "flex items-center gap-4 bg-card border rounded-xl p-4 transition-colors",
                isPlayer ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <span className="text-xl w-8 text-center font-mono">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <CountryFlag code={entry.country_code} size="sm" />
              <span className={cn("flex-1 font-semibold", isPlayer && "text-primary")}>{countryName(entry.country_code)}</span>
              <div className="text-right">
                <span className="font-bold font-mono text-primary">{entry.wins}W</span>
                <span className="text-muted-foreground font-mono text-sm ml-1">/ {entry.total}G</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
