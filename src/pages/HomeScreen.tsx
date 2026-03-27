import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectCountry } from '@/lib/country';
import { playClick, playMusicHome } from '@/lib/sounds';
import { useGameState } from '@/hooks/useGameState';
import { SpaceBackground } from '@/components/SpaceBackground';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { playerId, countryCode, xp, username } = useGameState();
  const [loading, setLoading] = useState(true);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 500) + 100);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('player_avatar') || '🌍');

  useEffect(() => { initPlayer(); }, []);

  useEffect(() => {
    const stored = localStorage.getItem('player_avatar') || '🌍';
    setAvatar(stored);
  }, [playerId, username]);

  useEffect(() => {
    const handler = () => { playMusicHome(); window.removeEventListener('click', handler); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => { playMusicHome(); }, []);

  async function initPlayer() {
    try {
      const existing = useGameState.getState();
      if (existing.playerId) { setLoading(false); return; }
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
      useGameState.setState({ playerId: id, userId: id, countryCode: finalCountry, username: name, xp: savedXp });
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#050810' }}>
        <div className="text-center space-y-4">
          <span className="text-6xl animate-float inline-block">🌍</span>
          <p className="text-muted-foreground font-display tracking-wider">LOADING...</p>
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
          className="w-11 h-11 rounded-full glass-card flex items-center justify-center text-xl hover:scale-110 transition-all animate-pulse-glow"
          title="Profile"
        >
          {avatar}
        </button>
        <h1 className="font-display text-lg font-bold text-glow-cyan tracking-widest text-primary">
          1v1 EARTH
        </h1>
        <div className="w-11" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 60px)' }}>
        {/* Player identity */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 rounded-full glass-card-strong flex items-center justify-center text-4xl mb-3 box-glow-cyan">
            {avatar}
          </div>
          <p className="text-foreground font-bold text-lg font-display tracking-wide">{username}</p>
          <p className="text-xs text-primary/70 font-mono tracking-wider">
            LEVEL {level} • {xp} XP
          </p>
        </div>

        {/* Find Opponent - EPIC button */}
        <button
          onClick={handleFindOpponent}
          disabled={!playerId}
          className="w-full max-w-[320px] h-16 text-xl font-display font-bold tracking-widest rounded-xl btn-epic text-primary-foreground mb-8 disabled:opacity-50"
        >
          ⚔️ FIND OPPONENT
        </button>

        {/* Online count */}
        <div className="flex items-center gap-2 text-sm mb-10">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-primary/70 tracking-wider">{onlineCount} PLAYERS ONLINE</span>
        </div>

        {/* Leaderboard */}
        <button
          onClick={() => { playClick(); navigate('/leaderboard'); }}
          className="text-muted-foreground hover:text-primary transition-colors font-display text-sm tracking-widest"
        >
          🏆 LEADERBOARD
        </button>
      </div>
    </div>
  );
}
