import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  country_code: string;
  total_wins: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { country_code: 'US', total_wins: 142 },
  { country_code: 'GB', total_wins: 98 },
  { country_code: 'DE', total_wins: 87 },
  { country_code: 'JP', total_wins: 76 },
  { country_code: 'BR', total_wins: 65 },
  { country_code: 'FR', total_wins: 54 },
  { country_code: 'IN', total_wins: 48 },
  { country_code: 'CA', total_wins: 41 },
  { country_code: 'AU', total_wins: 35 },
  { country_code: 'KR', total_wins: 29 },
];

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const [entries] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [nextReset, setNextReset] = useState('');

  useEffect(() => {
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
        <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
        <div />
      </div>

      <div className="text-center mb-6 bg-card border border-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">Weekly reset in</p>
        <p className="text-lg font-bold font-mono text-primary">{nextReset}</p>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div
            key={entry.country_code}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 transition-colors hover:border-primary/30"
          >
            <span className="text-xl w-8 text-center font-mono">
              {i < 3 ? medals[i] : `#${i + 1}`}
            </span>
            <CountryFlag code={entry.country_code} size="sm" />
            <span className="flex-1 font-semibold">{countryName(entry.country_code)}</span>
            <span className="font-bold font-mono text-primary">{entry.total_wins} W</span>
          </div>
        ))}
      </div>
    </div>
  );
}
