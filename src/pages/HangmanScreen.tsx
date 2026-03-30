import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { SpaceBackground } from '@/components/SpaceBackground';
import { playClick, playCorrect, playWrong, playMusicDuel } from '@/lib/sounds';

interface WordEntry { word: string; category: string }

const WORD_LIST: WordEntry[] = [
  { word: 'ELEPHANT', category: 'ANIMAL' },
  { word: 'PENGUIN', category: 'ANIMAL' },
  { word: 'BUTTERFLY', category: 'ANIMAL' },
  { word: 'COMPUTER', category: 'TECH' },
  { word: 'TELEPHONE', category: 'TECH' },
  { word: 'INSTRUMENT', category: 'MUSIC' },
  { word: 'UNIVERSE', category: 'SCIENCE' },
  { word: 'MOUNTAIN', category: 'NATURE' },
  { word: 'CHOCOLATE', category: 'FOOD' },
  { word: 'ADVENTURE', category: 'CONCEPT' },
  { word: 'BASKETBALL', category: 'SPORT' },
  { word: 'PRESIDENT', category: 'TITLE' },
  { word: 'HOSPITAL', category: 'PLACE' },
  { word: 'RESTAURANT', category: 'PLACE' },
  { word: 'DICTIONARY', category: 'OBJECT' },
];

const TOTAL_ROUNDS = 3;
const MAX_WRONG = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function pickWords(count: number): WordEntry[] {
  return [...WORD_LIST].sort(() => Math.random() - 0.5).slice(0, count);
}

/* ---------- Hangman SVG ---------- */
function HangmanDrawing({ wrong }: { wrong: number }) {
  const parts = [
    // head
    <circle key="head" cx="150" cy="70" r="18" stroke="#ef4444" strokeWidth="3" fill="none" className="animate-scale-in" />,
    // body
    <line key="body" x1="150" y1="88" x2="150" y2="140" stroke="#ef4444" strokeWidth="3" className="animate-scale-in" />,
    // left arm
    <line key="larm" x1="150" y1="100" x2="120" y2="125" stroke="#ef4444" strokeWidth="3" className="animate-scale-in" />,
    // right arm
    <line key="rarm" x1="150" y1="100" x2="180" y2="125" stroke="#ef4444" strokeWidth="3" className="animate-scale-in" />,
    // left leg
    <line key="lleg" x1="150" y1="140" x2="125" y2="175" stroke="#ef4444" strokeWidth="3" className="animate-scale-in" />,
    // right leg
    <line key="rleg" x1="150" y1="140" x2="175" y2="175" stroke="#ef4444" strokeWidth="3" className="animate-scale-in" />,
  ];

  return (
    <svg viewBox="0 0 250 200" className="w-48 h-36 mx-auto mb-4">
      {/* gallows */}
      <line x1="40" y1="190" x2="200" y2="190" stroke="#00f5ff" strokeWidth="3" opacity="0.6" />
      <line x1="80" y1="190" x2="80" y2="20" stroke="#00f5ff" strokeWidth="3" opacity="0.6" />
      <line x1="80" y1="20" x2="150" y2="20" stroke="#00f5ff" strokeWidth="3" opacity="0.6" />
      <line x1="150" y1="20" x2="150" y2="52" stroke="#00f5ff" strokeWidth="3" opacity="0.6" />
      {parts.slice(0, wrong)}
    </svg>
  );
}

export default function HangmanScreen() {
  const navigate = useNavigate();
  const { countryCode, opponentCountry, setResult, setScores, xp } = useGameState();

  const [words] = useState(() => pickWords(TOTAL_ROUNDS));
  const [round, setRound] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [myTotalScore, setMyTotalScore] = useState(0);
  const [oppTotalScore, setOppTotalScore] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'reveal' | 'finished'>('playing');
  const [roundOutcome, setRoundOutcome] = useState<'solved' | 'failed' | null>(null);
  const [shake, setShake] = useState(false);

  const oppTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { playMusicDuel(); }, []);

  const currentEntry = words[round] || { word: '', category: '' };
  const currentWord = currentEntry.word;
  const wrongLetters = [...guessedLetters].filter((l) => !currentWord.includes(l));
  const wrongCount = wrongLetters.length;
  const revealed = currentWord.split('').map((l) => (guessedLetters.has(l) ? l : '_'));
  const isSolved = currentWord.length > 0 && revealed.every((l) => l !== '_');
  const isFailed = wrongCount >= MAX_WRONG;

  // Detect round end
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!isSolved && !isFailed) return;

    if (isSolved) {
      playCorrect();
      const pts = wrongCount <= 2 ? 30 : wrongCount <= 4 ? 20 : 10;
      setMyTotalScore((s) => s + pts);
      setRoundOutcome('solved');
    } else {
      playWrong();
      setRoundOutcome('failed');
    }

    // Opponent scores randomly
    const oppPts = Math.random() < 0.45 ? 30 : Math.random() < 0.5 ? 20 : 0;
    if (oppPts > 0) setOppTotalScore((s) => s + oppPts);

    setPhase('reveal');
    setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        setPhase('finished');
      } else {
        setRound((r) => r + 1);
        setGuessedLetters(new Set());
        setRoundOutcome(null);
        setPhase('playing');
      }
    }, 2500);
  }, [isSolved, isFailed, phase]);

  // Finish
  useEffect(() => {
    if (phase !== 'finished') return;
    const r = myTotalScore > oppTotalScore ? 'win' : myTotalScore < oppTotalScore ? 'loss' : 'draw';
    const xpMap = { win: 45, loss: 10, draw: 25 } as const;
    const earned = xpMap[r];
    const newXp = xp + earned;
    localStorage.setItem('player_xp', String(newXp));
    useGameState.setState({ xp: newXp });
    setScores(myTotalScore, oppTotalScore);
    setResult(r, earned);
    setTimeout(() => navigate('/result'), 500);
  }, [phase]);

  const handleGuess = useCallback((letter: string) => {
    if (phase !== 'playing' || guessedLetters.has(letter)) return;
    playClick();
    const next = new Set(guessedLetters);
    next.add(letter);
    setGuessedLetters(next);

    if (!currentWord.includes(letter)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [phase, guessedLetters, currentWord]);

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className={`relative z-10 flex min-h-screen flex-col items-center px-4 py-6 max-w-[420px] mx-auto transition-transform ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <CountryFlag code={countryCode} size="sm" />
            <span className="font-mono font-bold text-primary text-lg" style={{ textShadow: '0 0 10px hsl(185 100% 50% / 0.5)' }}>{myTotalScore}</span>
          </div>
          <p className="text-xs text-muted-foreground font-display tracking-widest">ROUND {round + 1}/{TOTAL_ROUNDS}</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg" style={{ color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>{oppTotalScore}</span>
            <CountryFlag code={opponentCountry} size="sm" />
          </div>
        </div>

        {/* Category hint */}
        <div className="mb-2 px-4 py-1 rounded-full text-xs font-display tracking-[0.2em]"
          style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
          HINT: {currentEntry.category}
        </div>

        {/* Hangman drawing */}
        <HangmanDrawing wrong={wrongCount} />

        {/* Word blanks */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {currentWord.split('').map((letter, i) => {
            const isRevealed = guessedLetters.has(letter);
            const showAll = phase === 'reveal';
            const show = isRevealed || showAll;
            return (
              <div
                key={`${round}-${i}`}
                className={`w-10 h-12 flex items-center justify-center rounded-lg font-display font-black text-xl border transition-all ${
                  show ? 'animate-scale-in' : ''
                }`}
                style={{
                  background: show ? 'rgba(0, 245, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                  borderColor: show ? 'rgba(0, 245, 255, 0.4)' : 'rgba(255,255,255,0.1)',
                  color: showAll && !isRevealed ? '#22c55e' : '#00f5ff',
                  textShadow: show ? '0 0 10px rgba(0, 245, 255, 0.5)' : 'none',
                }}
              >
                {show ? letter : '_'}
              </div>
            );
          })}
        </div>

        {/* Wrong count */}
        <p className="text-xs font-mono mb-4" style={{ color: wrongCount >= 4 ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
          {wrongCount}/{MAX_WRONG} WRONG
        </p>

        {/* Round result */}
        {phase === 'reveal' && roundOutcome && (
          <div className="mb-4 font-display font-bold text-xl tracking-widest animate-scale-in"
            style={{
              color: roundOutcome === 'solved' ? '#22c55e' : '#ef4444',
              textShadow: roundOutcome === 'solved' ? '0 0 20px rgba(34,197,94,0.6)' : '0 0 20px rgba(239,68,68,0.6)',
            }}>
            {roundOutcome === 'solved' ? '✅ WORD SOLVED!' : '💀 HANGED!'}
          </div>
        )}

        {/* Keyboard */}
        {phase === 'playing' && (
          <div className="flex flex-wrap justify-center gap-1.5 max-w-[360px]">
            {ALPHABET.map((letter) => {
              const used = guessedLetters.has(letter);
              const isWrong = used && !currentWord.includes(letter);
              const isCorrect = used && currentWord.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={used}
                  className="w-9 h-10 rounded-lg font-display font-bold text-sm transition-all duration-200 disabled:cursor-not-allowed"
                  style={{
                    background: isCorrect
                      ? 'rgba(0, 245, 255, 0.2)'
                      : isWrong
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isCorrect ? 'rgba(0,245,255,0.4)' : isWrong ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: isCorrect ? '#00f5ff' : isWrong ? '#ef444466' : 'rgba(255,255,255,0.7)',
                    textDecoration: isWrong ? 'line-through' : 'none',
                    opacity: isWrong ? 0.4 : 1,
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
