import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { cn } from '@/lib/utils';
import { playCorrect, playWrong, playClick, playMusicDuel } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';

const EMOJI_PUZZLES = [
  { emojis: '🦁👑🌍', answer: 'LION KING', hint: 'Movie' },
  { emojis: '🕷️🕸️👨', answer: 'SPIDERMAN', hint: 'Superhero' },
  { emojis: '❄️👸🏔️', answer: 'FROZEN', hint: 'Movie' },
  { emojis: '🧙‍♂️💍🌋', answer: 'LORD OF THE RINGS', hint: 'Movie' },
  { emojis: '🦈🎵🎬', answer: 'JAWS', hint: 'Movie' },
  { emojis: '🚀⭐🌌', answer: 'STAR WARS', hint: 'Movie' },
  { emojis: '🍕🐢🥷', answer: 'NINJA TURTLES', hint: 'Show' },
  { emojis: '🦸‍♂️🦇🌃', answer: 'BATMAN', hint: 'Superhero' },
  { emojis: '🧟‍♂️🚶🌍', answer: 'WALKING DEAD', hint: 'Show' },
  { emojis: '👻🏠😱', answer: 'HAUNTED HOUSE', hint: 'Horror' },
  { emojis: '🐉🔥👑', answer: 'GAME OF THRONES', hint: 'Show' },
  { emojis: '🤖🚗💥', answer: 'TRANSFORMERS', hint: 'Movie' },
  { emojis: '🧠💊🔵', answer: 'LIMITLESS', hint: 'Movie' },
  { emojis: '🌊🏄🦈', answer: 'SURF', hint: 'Sport' },
  { emojis: '⚽🌍🏆', answer: 'WORLD CUP', hint: 'Sport' },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function EmojiGuessScreen() {
  const navigate = useNavigate();
  const { roomId, countryCode, opponentCountry, username, setResult, setScores, setDuelPhase } = useGameState();

  const ROUNDS = 5;
  const TIME_PER_ROUND = 15;

  const [puzzles] = useState(() => shuffle(EMOJI_PUZZLES).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(TIME_PER_ROUND);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [roundOver, setRoundOver] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roomId) { navigate('/'); return; }
    playMusicDuel();
    setDuelPhase('playing');
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!roundOver && !gameOver) {
      startTimer();
      setInput('');
      inputRef.current?.focus();
    }
  }, [round]);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(TIME_PER_ROUND);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleTimeUp() {
    // Opponent randomly gets it right 40% of the time
    if (Math.random() < 0.4) setOppScore(s => s + 10);
    setFeedback('wrong');
    setRoundOver(true);
    setTimeout(() => nextRound(), 2000);
  }

  function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = puzzles[round].answer;
    const isCorrect = input.trim().toUpperCase() === correct.toUpperCase();

    if (isCorrect) {
      playCorrect();
      const bonus = timer > 10 ? 15 : 10;
      setMyScore(s => s + bonus);
      setFeedback('correct');
    } else {
      playWrong();
      if (Math.random() < 0.5) setOppScore(s => s + 10);
      setFeedback('wrong');
    }
    setRoundOver(true);
    setTimeout(() => nextRound(), 2000);
  }

  function nextRound() {
    setFeedback(null);
    setRoundOver(false);
    if (round + 1 >= ROUNDS) {
      setGameOver(true);
      finishGame();
    } else {
      setRound(r => r + 1);
    }
  }

  function finishGame() {
    const finalMy = myScore;
    const finalOpp = oppScore;
    setScores(finalMy, finalOpp);
    const result = finalMy > finalOpp ? 'win' : finalMy < finalOpp ? 'loss' : 'draw';
    const xp = result === 'win' ? 40 : result === 'draw' ? 20 : 10;
    const currentXp = useGameState.getState().xp;
    useGameState.setState({ xp: currentXp + xp });
    setResult(result, xp);
    setDuelPhase('finished');
    navigate('/result');
  }

  const puzzle = puzzles[round];
  const timerDanger = timer <= 5;

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-6 max-w-[420px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <CountryFlag code={countryCode} size="sm" />
            <span className="text-primary font-bold font-mono text-lg text-glow-cyan">{myScore}</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-display tracking-wider">ROUND {round + 1}/{ROUNDS}</p>
            <p className="text-lg font-display font-black text-glow-cyan">🎭 VS 🎭</p>
          </div>
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <span className="text-destructive font-bold font-mono text-lg">{oppScore}</span>
            <CountryFlag code={opponentCountry} size="sm" />
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full mb-6">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-linear",
                timerDanger ? "bg-destructive animate-pulse" : "bg-primary")}
              style={{ width: `${(timer / TIME_PER_ROUND) * 100}%` }}
            />
          </div>
          <p className={cn("text-center text-sm font-mono mt-1",
            timerDanger ? "text-destructive font-bold" : "text-primary/60")}>{timer}s</p>
        </div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground font-display tracking-widest mb-2">
          HINT: {puzzle.hint}
        </p>

        {/* Emoji display */}
        <div className="glass-card rounded-2xl p-8 mb-6 w-full text-center"
          style={{ boxShadow: '0 0 40px rgba(244,63,142,0.2)' }}>
          <p className="text-6xl mb-2 tracking-widest">{puzzle.emojis}</p>
        </div>

        {/* Feedback overlay */}
        {feedback && (
          <div className={cn("w-full rounded-xl p-3 text-center font-display font-bold tracking-wider mb-4",
            feedback === 'correct' ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "bg-red-500/20 text-red-400 border border-red-500/40")}>
            {feedback === 'correct' ? '✅ CORRECT!' : `❌ ANSWER: ${puzzle.answer}`}
          </div>
        )}

        {/* Input */}
        {!roundOver && (
          <div className="w-full flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              className="flex-1 glass-card rounded-xl px-4 py-3 text-foreground font-mono text-sm outline-none border border-primary/30 focus:border-primary/70 bg-transparent placeholder:text-muted-foreground"
              style={{ boxShadow: '0 0 15px rgba(0,245,255,0.1)' }}
              autoComplete="off"
            />
            <button
              onClick={() => { playClick(); handleSubmit(); }}
              className="glass-card rounded-xl px-4 py-3 font-display font-bold text-sm tracking-wider transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f43f8e, #f43f8e99)', color: '#050810' }}
            >
              GO
            </button>
          </div>
        )}

        {/* Game label */}
        <div className="glass-card rounded-xl px-4 py-2 text-center mt-6">
          <p className="text-xs text-muted-foreground font-display tracking-wider">EMOJI GUESS • {ROUNDS} ROUNDS</p>
        </div>
      </div>
    </div>
  );
}
