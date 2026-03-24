import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectCountry } from '@/lib/country';
import { playClick, playMusicHome } from '@/lib/sounds';
import { useGameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { SpaceBackground } from '@/components/SpaceBackground';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { playerId, countryCode, xp, username } = useGameState();
  const [loading, setLoading] = useState(true);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 500) + 100);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('player_avatar') || '🌍');

  useEffect(() => {
    initPlayer();
  }, []);

  // Refresh avatar when returning from profile
  useEffect(() => {
    const stored = localStorage.getItem('player_avatar') || '🌍';
    setAvatar(stored);
  }, [playerId, username]);

  // Start home music on first interaction
  useEffect(() => {
    const handler = () => { playMusicHome(); window.removeEventListener('click', handler); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // Also play home music when screen mounts (if audio already unlocked)
  useEffect(() => { playMusicHome(); }, []);

  async function initPlayer() {
    try {
      const existing = useGameState.getState();
      if (existing.playerId) {
        setLoading(false);
        return;
      }

      const id = crypto.randomUUID();
      const savedName = localStorage.getItem('player_name');
      const savedCountry = localStorage.getItem('player_country');
      const savedXp = Number(localStorage.getItem('player_xp') || '0');

      let finalCountry = savedCountry;
      if (!finalCountry) {
        finalCountry = await detectCountry();
        localStorage.setItem('player_country', finalCountry);
      }

      const name = savedName || `Player_${id.slice(0, 4)}`;
      if (!savedName) localStorage.setItem('player_name', name);

      useGameState.setState({
        playerId: id,
        userId: id,
        countryCode: finalCountry,
        username: name,
        xp: savedXp,
      });
    } catch (e) {
      console.error('Init failed:', e);
      const id = crypto.randomUUID();
      const fallbackName = localStorage.getItem('player_name') || `Player_${id.slice(0, 4)}`;
      const fallbackCountry = localStorage.getItem('player_country') || 'UN';
      const fallbackXp = Number(localStorage.getItem('player_xp') || '0');
      useGameState.setState({ playerId: id, userId: id, countryCode: fallbackCountry, username: fallbackName, xp: fallbackXp });
    } finally {
      setLoading(false);
    }
  }

  function handleFindOpponent() {
    if (!playerId) return;
    playClick();
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
    <div className="relative min-h-screen">
      <SpaceBackground />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => { playClick(); navigate('/profile'); }}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-xl hover:border-primary hover:scale-105 transition-all"
          title="Profile"
        >
          {avatar}
        </button>
        <h1 className="text-lg font-bold text-glow-blue tracking-tight">1v1 Earth</h1>
        {/* MuteButton is rendered globally in App.tsx — this is a spacer */}
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 60px)' }}>
        {/* Player identity */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-3xl mb-2">
            {avatar}
          </div>
          <p className="text-foreground font-semibold">{username}</p>
          <p className="text-xs text-muted-foreground font-mono">Level {level} • {xp} XP</p>
        </div>

        {/* Find Opponent */}
        <Button
          onClick={handleFindOpponent}
          disabled={!playerId}
          className="w-full max-w-[320px] h-16 text-xl font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] box-glow-blue mb-6"
        >
          ⚔️ Find Opponent
        </Button>

        {/* Online count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono">{onlineCount} players online</span>
        </div>

        {/* Leaderboard */}
        <Button
          variant="ghost"
          onClick={() => { playClick(); navigate('/leaderboard'); }}
          className="text-muted-foreground hover:text-foreground"
        >
          🏆 Leaderboard
        </Button>
      </div>
    </div>
  );
}
