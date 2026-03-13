import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { detectCountry } from '@/lib/country';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { Button } from '@/components/ui/button';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { playerId, countryCode, xp, setPlayer } = useGameState();
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 500) + 100);

  useEffect(() => {
    initPlayer();
  }, []);

  async function initPlayer() {
    try {
      // Sign in anonymously
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data } = await supabase.auth.signInAnonymously();
        session = data.session;
      }
      if (!session) return;

      const userId = session.user.id;
      const country = await detectCountry();

      // Get or create player
      let { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!player) {
        const { data: newPlayer } = await supabase
          .from('players')
          .insert({ user_id: userId, country_code: country, username: `Player_${userId.slice(0, 4)}` })
          .select()
          .single();
        player = newPlayer;
      }

      if (player) {
        setPlayer({
          playerId: player.id,
          userId,
          countryCode: player.country_code,
          username: player.username,
          xp: player.xp,
        });
      }
    } catch (e) {
      console.error('Init failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFindOpponent() {
    if (!playerId) return;
    setFinding(true);
    navigate('/matchmaking');
  }

  const level = Math.floor(xp / 200) + 1;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <span className="text-6xl animate-float inline-block">🌍</span>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-[420px] mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-glow-blue mb-2 tracking-tight">1v1 Earth</h1>
        <p className="text-muted-foreground text-sm">Global Trivia Duels</p>
      </div>

      {/* Player Card */}
      <div className="w-full rounded-xl bg-card border border-border p-6 mb-6 box-glow-blue">
        <div className="flex items-center gap-4">
          <CountryFlag code={countryCode} size="lg" />
          <div className="flex-1">
            <p className="text-lg font-semibold">{useGameState.getState().username}</p>
            <p className="text-sm text-muted-foreground font-mono">Level {level} • {xp} XP</p>
          </div>
        </div>
      </div>

      {/* Find Opponent Button */}
      <Button
        onClick={handleFindOpponent}
        disabled={finding || !playerId}
        className="w-full h-16 text-xl font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] box-glow-blue"
      >
        {finding ? 'Searching...' : '⚔️ Find Opponent'}
      </Button>

      {/* Online Count */}
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-glow-green animate-pulse" />
        <span className="font-mono">{onlineCount} players online</span>
      </div>

      {/* Nav */}
      <div className="mt-8 flex gap-4">
        <Button variant="ghost" onClick={() => navigate('/leaderboard')} className="text-muted-foreground hover:text-foreground">
          🏆 Leaderboard
        </Button>
      </div>
    </div>
  );
}
