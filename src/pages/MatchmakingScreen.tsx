import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { fetchQuestions } from '@/lib/trivia';
import { CountryFlag } from '@/components/CountryFlag';
import { GlobeSpinner } from '@/components/GlobeSpinner';
import { playMatchFound, playClick, playMusicMatchmaking } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';
import type { GameMode } from '@/hooks/useGameState';

const FAKE_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'BR', 'IN', 'CA', 'AU', 'KR', 'MX', 'ES', 'IT', 'NL', 'SE'];

const GAME_ROUTES: Record<GameMode, string> = {
  trivia: '/duel',
  tictactoe: '/tictactoe',
  wordscramble: '/duel',
  hangman: '/duel',
};

export default function MatchmakingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameId = ((location.state as any)?.gameId || 'trivia') as GameMode;
  const { playerId, countryCode, setRoom, setQuestions, setGameMode, reset } = useGameState();
  const [status, setStatus] = useState<'searching' | 'found'>('searching');
  const [opponentCountry, setOpponentCountry] = useState('');
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!playerId) { navigate('/'); return; }
    playMusicMatchmaking();
    setGameMode(gameId);
    simulateMatchmaking();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function simulateMatchmaking() {
    // Only fetch trivia questions for trivia mode
    const questions = gameId === 'trivia' ? await fetchQuestions() : [];
    const oppCountry = FAKE_COUNTRIES[Math.floor(Math.random() * FAKE_COUNTRIES.length)];
    timerRef.current = setTimeout(() => {
      const roomId = crypto.randomUUID();
      const opponentId = crypto.randomUUID();
      setOpponentCountry(oppCountry);
      setRoom(roomId, opponentId, oppCountry);
      if (questions.length) setQuestions(questions);
      setStatus('found');
      playMatchFound();
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) { clearInterval(interval); navigate(GAME_ROUTES[gameId]); }
      }, 1000);
    }, 3000);
  }

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 max-w-[420px] mx-auto">
        {status === 'searching' && (
          <div className="text-center space-y-8">
            <GlobeSpinner />
            <div>
              <h2 className="text-3xl font-display font-bold text-glow-cyan tracking-wider">SEARCHING...</h2>
              <p className="text-primary/50 text-sm font-display tracking-widest mt-1">SCANNING GLOBALLY</p>
            </div>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center animate-slide-left">
                <div className="glass-card-strong rounded-xl p-4 box-glow-cyan">
                  <CountryFlag code={countryCode} size="lg" />
                </div>
                <p className="text-xs text-primary/60 mt-2 font-display tracking-wider">YOU</p>
              </div>
              <span className="text-4xl animate-pulse text-glow-cyan">⚔️</span>
              <div className="text-center animate-slide-right">
                <div className="glass-card rounded-xl p-4">
                  <span className="text-6xl animate-pulse">❓</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-display tracking-wider">???</p>
              </div>
            </div>
            <button onClick={() => { playClick(); reset(); navigate('/'); }} className="text-muted-foreground hover:text-primary transition-colors font-display text-sm tracking-widest">
              CANCEL
            </button>
          </div>
        )}

        {status === 'found' && (
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-display font-bold text-glow-cyan animate-dramatic-reveal tracking-wider">
              OPPONENT FOUND!
            </h2>

            {/* Energy rings */}
            <div className="relative flex items-center justify-center gap-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full animate-energy-ring" style={{ border: '2px solid rgba(0, 245, 255, 0.3)' }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full animate-energy-ring" style={{ border: '1px solid rgba(0, 245, 255, 0.15)', animationDelay: '0.5s' }} />
              </div>

              <div className="text-center animate-slide-left relative z-10">
                <div className="glass-card-strong rounded-xl p-4 box-glow-cyan">
                  <CountryFlag code={countryCode} size="lg" />
                </div>
                <p className="text-xs text-primary/60 mt-2 font-display tracking-wider">YOU</p>
              </div>
              <span className="text-4xl relative z-10 text-glow-cyan">⚡</span>
              <div className="text-center animate-slide-right relative z-10">
                <div className="glass-card-strong rounded-xl p-4 box-glow-cyan">
                  <CountryFlag code={opponentCountry} size="lg" />
                </div>
                <p className="text-xs text-primary/60 mt-2 font-display tracking-wider">OPPONENT</p>
              </div>
            </div>

            <div className="text-8xl font-display font-black text-primary text-glow-cyan animate-pulse">
              {countdown}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
