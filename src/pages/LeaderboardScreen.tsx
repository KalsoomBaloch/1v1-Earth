import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  country_code: string;
  total_wins: number;
}

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextReset, setNextReset] = useState('');

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000);
    updateResetTimer();
    const timerInterval = setInterval(updateResetTimer, 1000);
    return () => { clearInterval(interval); clearInterval(timerInterval); };
  }, []);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('players')
      .select('country_code, wins');

    if (data) {
      const grouped: Record<string, number> = {};
      data.forEach(p => {
        grouped[p.country_code] = (grouped[p.country_code] || 0) + p.wins;
      });

      const sorted = Object.entries(grouped)
        .map(([country_code, total_wins]) => ({ country_code, total_wins }))
        .sort((a, b) => b.total_wins - a.total_wins)
        .slice(0, 10);

      setEntries(sorted);
    }
    setLoading(false);
  }

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

      {/* Reset timer */}
      <div className="text-center mb-6 bg-card border border-border rounded-xl p-3">
        <p className="text-xs text-muted-foreground">Weekly reset in</p>
        <p className="text-lg font-bold font-mono text-primary">{nextReset}</p>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-4xl mb-3">🌍</p>
            <p>No games played yet. Be the first!</p>
          </div>
        ) : (
          entries.map((entry, i) => (
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
          ))
        )}
      </div>
    </div>
  );
}
