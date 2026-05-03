import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectCountry } from '@/lib/country';
import { playClick, playMusicHome } from '@/lib/sounds';
import { useGameState } from '@/hooks/useGameState';
import { SpaceBackground } from '@/components/SpaceBackground';

const GAMES = [
  { id: 'trivia', icon: '🧠', name: 'Trivia Duel', desc: 'Battle of knowledge', accent: '185 100% 50%', accentHex: '#00f5ff' },
  { id: 'tictactoe', icon: '⭕', name: 'Tic Tac Toe', desc: 'Classic strategy', accent: '271 91% 65%', accentHex: '#a855f7' },
  { id: 'wordscramble', icon: '📝', name: 'Word Scramble', desc: 'Unscramble fastest', accent: '142 71% 45%', accentHex: '#22c55e' },
  { id: 'hangman', icon: '💀', name: 'Hangman', desc: 'Guess the word', accent: '25 95% 53%', accentHex: '#f97316' },
  { id: 'emojiguess', icon: '🎭', name: 'Emoji Guess', desc: 'Decode the emojis', accent: '330 90% 60%', accentHex: '#f43f8e' },
  { id: 'chess', icon: '♟️', name: 'Chess', desc: 'Ultimate strategy', accent: '45 95% 55%', accentHex: '#eab308' },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { playerId, xp, username } = useGameState();
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

  function handlePlay(gameId: string) {
    if (!playerId) return;
    playClick();
    navigate('/matchmaking', { state: { gameId } });
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
      <div className="relative z-10 flex flex-col items-center px-4 pt-4 pb-8">
        {/* Player info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full glass-card-strong flex items-center justify-center text-xl box-glow-cyan">
            {avatar}
          </div>
          <div>
            <p className="text-foreground font-bold text-sm font-display tracking-wide">{username}</p>
            <p className="text-xs text-primary/70 font-mono tracking-wider">LVL {level} • {xp} XP</p>
          </div>
        </div>

        {/* Subtitle */}
        <h2 className="font-display text-xl font-bold tracking-[0.2em] text-glow-cyan text-primary mb-6">
          SELECT YOUR BATTLE
        </h2>

        {/* 2x2 Game Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-[400px] mb-8">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => handlePlay(game.id)}
              disabled={!playerId}
              className="group relative flex flex-col items-center rounded-xl p-4 pt-5 pb-4 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 glass-card"
              style={{
                borderColor: game.accentHex,
                borderWidth: '1px',
                boxShadow: `0 0 15px ${game.accentHex}33, 0 0 40px ${game.accentHex}11, inset 0 0 15px ${game.accentHex}08`,
              }}
            >
              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `0 0 25px ${game.accentHex}55, 0 0 60px ${game.accentHex}22` }}
              />

              <span className="text-4xl mb-2">{game.icon}</span>
              <p className="font-display font-bold text-sm text-foreground tracking-wide text-center">{game.name}</p>
              <p className="text-xs text-muted-foreground text-center mb-3">{game.desc}</p>

              <span
                className="font-display text-xs font-bold tracking-[0.2em] px-4 py-1.5 rounded-lg transition-all duration-300 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${game.accentHex}, ${game.accentHex}99)`,
                  color: '#050810',
                  boxShadow: `0 0 12px ${game.accentHex}44`,
                }}
              >
                PLAY
              </span>
            </button>
          ))}
        </div>

        {/* Online count */}
        <div className="flex items-center gap-2 text-sm mb-6">
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
