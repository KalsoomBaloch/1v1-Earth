import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { fetchQuestions } from '@/lib/trivia';
import { CountryFlag } from '@/components/CountryFlag';
import { GlobeSpinner } from '@/components/GlobeSpinner';
import { Button } from '@/components/ui/button';
import { playMatchFound, playClick, playMusicMatchmaking } from '@/lib/sounds';

const FAKE_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'BR', 'IN', 'CA', 'AU', 'KR', 'MX', 'ES', 'IT', 'NL', 'SE'];

export default function MatchmakingScreen() {
  const navigate = useNavigate();
  const { playerId, countryCode, setRoom, setQuestions, reset } = useGameState();
  const [status, setStatus] = useState<'searching' | 'found'>('searching');
  const [opponentCountry, setOpponentCountry] = useState('');
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }
    playMusicMatchmaking();
    simulateMatchmaking();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function simulateMatchmaking() {
    const questions = await fetchQuestions();
    const oppCountry = FAKE_COUNTRIES[Math.floor(Math.random() * FAKE_COUNTRIES.length)];

    timerRef.current = setTimeout(() => {
      const roomId = crypto.randomUUID();
      const opponentId = crypto.randomUUID();
      setOpponentCountry(oppCountry);
      setRoom(roomId, opponentId, oppCountry);
      setQuestions(questions);
      setStatus('found');
      playMatchFound();

      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          navigate('/duel');
        }
      }, 1000);
    }, 3000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 max-w-[420px] mx-auto">
      {status === 'searching' && (
        <div className="text-center space-y-8">
          <GlobeSpinner />
          <div>
            <h2 className="text-2xl font-bold mb-2">Finding Opponent...</h2>
            <p className="text-muted-foreground text-sm">Searching globally</p>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <CountryFlag code={countryCode} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">You</p>
            </div>
            <span className="text-3xl text-muted-foreground animate-pulse">⚔️</span>
            <div className="text-center">
              <span className="text-6xl animate-pulse">❓</span>
              <p className="text-xs text-muted-foreground mt-2">???</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => { playClick(); reset(); navigate('/'); }} className="text-muted-foreground">
            Cancel
          </Button>
        </div>
      )}

      {status === 'found' && (
        <div className="text-center space-y-8">
          <h2 className="text-2xl font-bold text-glow-blue">Opponent Found!</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <CountryFlag code={countryCode} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">You</p>
            </div>
            <span className="text-3xl">⚔️</span>
            <div className="text-center">
              <CountryFlag code={opponentCountry} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">Opponent</p>
            </div>
          </div>
          <div className="text-8xl font-bold text-primary text-glow-blue animate-pulse">
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
}
