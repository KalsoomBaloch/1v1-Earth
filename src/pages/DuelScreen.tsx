import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { cn } from '@/lib/utils';
import { playCorrect, playWrong, playCountdownTick, playMusicDuel } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';

export default function DuelScreen() {
  const navigate = useNavigate();
  const {
    roomId, questions, currentQuestion, myScore, opponentScore,
    myAnswers, opponentAnswered, timeLeft, countryCode, opponentCountry,
    submitAnswer, setOpponentAnswered, incrementOpponentScore, nextQuestion,
    setTimeLeft, setDuelPhase, setResult, username,
  } = useGameState();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());
  const [flashState, setFlashState] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!roomId || !questions.length) { navigate('/'); return; }
    playMusicDuel();
    setDuelPhase('playing');
    startTimer();
    simulateOpponent(0);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (currentQuestion > 0) {
      setSelectedAnswer(null);
      setRevealed(false);
      setFlashState(null);
      setAnswerStartTime(Date.now());
      startTimer();
      simulateOpponent(currentQuestion);
    }
  }, [currentQuestion]);

  function simulateOpponent(qi: number) {
    const delay = 2000 + Math.random() * 6000;
    setTimeout(() => {
      const state = useGameState.getState();
      if (state.currentQuestion !== qi) return;
      setOpponentAnswered(qi);
      if (Math.random() > 0.5) incrementOpponentScore();
    }, delay);
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      const t = useGameState.getState().timeLeft - 1;
      setTimeLeft(t);
      if (t > 0) playCountdownTick();
      if (t <= 0) { clearInterval(timerRef.current); handleTimerEnd(); }
    }, 1000);
  }

  const handleTimerEnd = useCallback(() => {
    const state = useGameState.getState();
    if (state.myAnswers[state.currentQuestion] === null) doSubmitAnswer(null);
  }, []);

  function doSubmitAnswer(answer: string | null) {
    const state = useGameState.getState();
    const qi = state.currentQuestion;
    const timeTaken = (Date.now() - answerStartTime) / 1000;
    submitAnswer(qi, answer || '');
    const isCorrect = answer === state.questions[qi]?.correct_answer;
    setFlashState(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) playCorrect(); else playWrong();
    setRevealed(true);
    setTimeout(() => {
      if (qi >= 4) finishDuel(timeTaken < 3 ? 10 : 0);
      else nextQuestion();
    }, 2000);
  }

  function handleSelectAnswer(answer: string) {
    if (selectedAnswer || revealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(answer);
    doSubmitAnswer(answer);
  }

  function finishDuel(lastSpeedBonus: number) {
    const state = useGameState.getState();
    let result: 'win' | 'loss' | 'draw';
    let baseXp: number;
    if (state.myScore > state.opponentScore) { result = 'win'; baseXp = 50; }
    else if (state.myScore < state.opponentScore) { result = 'loss'; baseXp = 10; }
    else { result = 'draw'; baseXp = 25; }
    setResult(result, baseXp + lastSpeedBonus);
    setDuelPhase('finished');
    navigate('/result');
  }

  if (!questions.length) return null;
  const q = questions[currentQuestion];
  if (!q) return null;

  const timerDanger = timeLeft <= 3;

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className={cn(
        "relative z-10 flex min-h-screen flex-col px-4 py-6 max-w-[420px] mx-auto transition-colors duration-500",
        flashState === 'correct' && 'animate-flash-correct',
        flashState === 'wrong' && 'animate-flash-wrong animate-shake',
      )}>
        {/* Score header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <CountryFlag code={countryCode} size="sm" />
            <div className="flex flex-col">
              <span className="text-[10px] text-primary/60 font-display tracking-wider leading-none">{username}</span>
              <span className="font-bold text-primary font-mono text-lg text-glow-cyan">{myScore}</span>
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-primary/60 font-display tracking-wider">Q{currentQuestion + 1}/5</span>
            <p className="text-2xl font-display font-black text-glow-cyan">⚡VS⚡</p>
          </div>
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-primary/60 font-display tracking-wider leading-none">{countryName(opponentCountry)}</span>
              <span className="font-bold text-destructive font-mono text-lg text-glow-red">{opponentScore}</span>
            </div>
            <CountryFlag code={opponentCountry} size="sm" />
          </div>
        </div>

        {/* Timer bar */}
        <div className="mb-6">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                timerDanger ? "bg-destructive" : "bg-primary",
                timerDanger && "animate-pulse"
              )}
              style={{
                width: `${(timeLeft / 10) * 100}%`,
                boxShadow: timerDanger
                  ? '0 0 15px rgba(255, 60, 60, 0.6)'
                  : '0 0 15px rgba(0, 245, 255, 0.4)',
              }}
            />
          </div>
          <p className={cn(
            "text-center text-sm font-mono mt-1",
            timerDanger ? "text-destructive text-glow-red font-bold" : "text-primary/60"
          )}>{timeLeft}s</p>
        </div>

        {/* Opponent status */}
        <div className="text-center mb-4">
          {opponentAnswered[currentQuestion] ? (
            <span className="text-xs text-primary font-display tracking-wider text-glow-cyan">✓ OPPONENT ANSWERED</span>
          ) : (
            <span className="text-xs text-muted-foreground font-display tracking-wider animate-pulse">OPPONENT THINKING...</span>
          )}
        </div>

        {/* Question */}
        <div className="glass-card-strong rounded-xl p-5 mb-6 shine-sweep">
          <p className="text-lg font-bold leading-relaxed font-display">{q.question}</p>
        </div>

        {/* Answers */}
        <div className="space-y-3 flex-1">
          {q.all_answers.map((answer, i) => {
            const isSelected = selectedAnswer === answer;
            const isCorrect = answer === q.correct_answer;
            const showResult = revealed;

            return (
              <button
                key={i}
                onClick={() => handleSelectAnswer(answer)}
                disabled={!!selectedAnswer || revealed}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all font-semibold font-display tracking-wide",
                  !showResult && !isSelected && "glass-card hover:box-glow-cyan hover:border-primary/50 hover:scale-[1.02]",
                  !showResult && isSelected && "glass-card-strong box-glow-cyan",
                  showResult && isCorrect && "border-primary bg-primary/10 box-glow-cyan scale-[1.02]",
                  showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10 box-glow-red scale-95 opacity-80",
                  showResult && !isCorrect && !isSelected && "opacity-30",
                )}
              >
                <span className="mr-3 text-primary/60 font-mono text-sm">
                  {String.fromCharCode(65 + i)}
                </span>
                {answer}
                {showResult && isCorrect && <span className="float-right text-primary">✓</span>}
                {showResult && isSelected && !isCorrect && <span className="float-right text-destructive">✗</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
