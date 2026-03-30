import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { SpaceBackground } from '@/components/SpaceBackground';
import { playClick, playCorrect, playWrong, playMusicDuel } from '@/lib/sounds';

const WORD_POOL: Record<string, string[]> = {
  Animals: ['TIGER', 'RABBIT', 'ELEPHANT', 'DOLPHIN', 'PENGUIN', 'GIRAFFE', 'LEOPARD', 'HAMSTER'],
  Countries: ['FRANCE', 'BRAZIL', 'CANADA', 'MEXICO', 'JAPAN', 'EGYPT', 'INDIA', 'RUSSIA'],
  Food: ['PIZZA', 'BURGER', 'MANGO', 'BANANA', 'COOKIE', 'WAFFLE', 'SUSHI', 'PASTA'],
  Sports: ['TENNIS', 'HOCKEY', 'BOXING', 'CRICKET', 'SOCCER', 'SWIMMING', 'CYCLING'],
  Tech: ['LAPTOP', 'MOUSE', 'KEYBOARD', 'MONITOR', 'TABLET', 'PHONE', 'CAMERA'],
};

const ALL_WORDS = Object.values(WORD_POOL).flat();
const TOTAL_ROUNDS = 5;
const ROUND_TIME = 15;

function scramble(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scramble(word) : result;
}

function pickWords(count: number): string[] {
  const shuffled = [...ALL_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function WordScrambleScreen() {
  const navigate = useNavigate();
  const { countryCode, opponentCountry, setResult, setScores, xp, reset } = useGameState();

  const [words] = useState(() => pickWords(TOTAL_ROUNDS));
  const [round, setRound] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'reveal' | 'finished'>('playing');
  const [roundResult, setRoundResult] = useState<'correct' | 'wrong' | null>(null);
  const [oppAnswered, setOppAnswered] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [shake, setShake] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const oppTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Start round
  useEffect(() => {
    playMusicDuel();
  }, []);

  useEffect(() => {
    if (round >= TOTAL_ROUNDS) return;
    setScrambled(scramble(words[round]));
    setInput('');
    setTimeLeft(ROUND_TIME);
    setPhase('playing');
    setRoundResult(null);
    setOppAnswered(false);
    setRoundStartTime(Date.now());
    setShake(false);
    inputRef.current?.focus();

    // Opponent timer
    const oppDelay = 5000 + Math.random() * 7000;
    oppTimerRef.current = setTimeout(() => {
      setOppAnswered(true);
      const correct = Math.random() < 0.5;
      if (correct) setOppScore((s) => s + 10 + (oppDelay < 5000 ? 5 : 0));
    }, oppDelay);

    return () => { if (oppTimerRef.current) clearTimeout(oppTimerRef.current); };
  }, [round, words]);

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, round]);

  const handleSubmit = useCallback((timeout = false) => {
    if (phase !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const answer = timeout ? '' : input.trim().toUpperCase();
    const correct = answer === words[round];
    const elapsed = (Date.now() - roundStartTime) / 1000;

    if (correct) {
      playCorrect();
      const bonus = elapsed < 5 ? 5 : 0;
      setMyScore((s) => s + 10 + bonus);
      setRoundResult('correct');
    } else {
      playWrong();
      setRoundResult('wrong');
      setShake(true);
    }

    setPhase('reveal');

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('finished');
      } else {
        setRound(nextRound);
      }
    }, 2000);
  }, [phase, input, words, round, roundStartTime]);

  // Finish
  useEffect(() => {
    if (phase !== 'finished') return;
    const finalMy = myScore;
    const finalOpp = oppScore;
    const r = finalMy > finalOpp ? 'win' : finalMy < finalOpp ? 'loss' : 'draw';
    const xpMap = { win: 40, loss: 10, draw: 20 };
    const earned = xpMap[r];
    const newXp = xp + earned;
    localStorage.setItem('player_xp', String(newXp));
    useGameState.setState({ xp: newXp });
    setScores(finalMy, finalOpp);
    setResult(r, earned);
    setTimeout(() => navigate('/result'), 500);
  }, [phase]);

  const currentWord = words[round] || '';

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-6 max-w-[420px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <CountryFlag code={countryCode} size="sm" />
            <span className="font-mono font-bold text-primary text-lg" style={{ textShadow: '0 0 10px hsl(185 100% 50% / 0.5)' }}>{myScore}</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-display tracking-widest">ROUND {round + 1}/{TOTAL_ROUNDS}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg" style={{ color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>{oppScore}</span>
            <CountryFlag code={opponentCountry} size="sm" />
          </div>
        </div>

        {/* Timer */}
        <div className={`font-mono text-3xl font-black mb-6 transition-colors ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-primary'}`}
          style={{ textShadow: timeLeft <= 5 ? '0 0 15px rgba(239,68,68,0.6)' : '0 0 15px hsl(185 100% 50% / 0.4)' }}>
          {timeLeft}s
        </div>

        {/* Scrambled letters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {scrambled.split('').map((letter, i) => (
            <div
              key={`${round}-${i}`}
              className="w-12 h-14 flex items-center justify-center rounded-lg font-display font-black text-2xl animate-scale-in"
              style={{
                background: 'rgba(0, 245, 255, 0.08)',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                color: '#00f5ff',
                textShadow: '0 0 12px rgba(0, 245, 255, 0.6)',
                boxShadow: '0 0 15px rgba(0, 245, 255, 0.15), inset 0 0 10px rgba(0, 245, 255, 0.05)',
                animationDelay: `${i * 0.08}s`,
                animationFillMode: 'both',
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Reveal correct word */}
        {phase === 'reveal' && (
          <div className={`mb-4 text-center ${roundResult === 'correct' ? 'animate-scale-in' : ''}`}>
            <p className="text-xs text-muted-foreground font-display tracking-widest mb-1">CORRECT WORD</p>
            <p className="font-display font-black text-2xl tracking-widest"
              style={{ color: '#22c55e', textShadow: '0 0 20px rgba(34,197,94,0.6)' }}>
              {currentWord}
            </p>
          </div>
        )}

        {/* Input */}
        {phase === 'playing' && (
          <div className="w-full space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
              placeholder="TYPE YOUR ANSWER..."
              autoComplete="off"
              className={`w-full h-14 rounded-xl px-4 text-center font-display font-bold text-lg tracking-widest bg-background/50 border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${
                shake ? 'animate-[shake_0.5s_ease-in-out] border-destructive' : 'border-primary/30 focus:border-primary focus:shadow-[0_0_20px_rgba(0,245,255,0.2)]'
              }`}
            />
            <button
              onClick={() => { playClick(); handleSubmit(); }}
              className="w-full h-12 rounded-xl font-display font-bold tracking-widest text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #22c55e99)',
                color: '#050810',
                boxShadow: '0 0 20px rgba(34,197,94,0.3)',
              }}
            >
              SUBMIT
            </button>
          </div>
        )}

        {/* Round result feedback */}
        {phase === 'reveal' && roundResult && (
          <div className={`mt-4 font-display font-bold text-xl tracking-widest ${
            roundResult === 'correct' ? 'animate-scale-in' : ''
          }`} style={{
            color: roundResult === 'correct' ? '#22c55e' : '#ef4444',
            textShadow: roundResult === 'correct' ? '0 0 20px rgba(34,197,94,0.6)' : '0 0 20px rgba(239,68,68,0.6)',
          }}>
            {roundResult === 'correct' ? '✅ CORRECT!' : '❌ WRONG!'}
          </div>
        )}

        {/* Opponent status */}
        <div className="mt-6 text-xs text-muted-foreground font-display tracking-widest">
          {oppAnswered ? 'OPPONENT ANSWERED' : 'OPPONENT THINKING...'}
        </div>
      </div>
    </div>
  );
}
