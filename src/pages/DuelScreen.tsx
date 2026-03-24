import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { cn } from '@/lib/utils';
import { playCorrect, playWrong, playCountdownTick, playMusicDuel } from '@/lib/sounds';

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
    if (!roomId || !questions.length) {
      navigate('/');
      return;
    }
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
      if (t <= 0) {
        clearInterval(timerRef.current);
        handleTimerEnd();
      }
    }, 1000);
  }

  const handleTimerEnd = useCallback(() => {
    const state = useGameState.getState();
    if (state.myAnswers[state.currentQuestion] === null) {
      doSubmitAnswer(null);
    }
  }, []);

  function doSubmitAnswer(answer: string | null) {
    const state = useGameState.getState();
    const qi = state.currentQuestion;
    const timeTaken = (Date.now() - answerStartTime) / 1000;

    submitAnswer(qi, answer || '');

    const isCorrect = answer === state.questions[qi]?.correct_answer;
    setFlashState(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) playCorrect(); else playWrong();

    const speedBonus = timeTaken < 3 ? 10 : 0;
    setRevealed(true);

    setTimeout(() => {
      if (qi >= 4) {
        finishDuel(speedBonus);
      } else {
        nextQuestion();
      }
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
    const finalMyScore = state.myScore;
    const finalOppScore = state.opponentScore;

    let result: 'win' | 'loss' | 'draw';
    let baseXp: number;

    if (finalMyScore > finalOppScore) {
      result = 'win'; baseXp = 50;
    } else if (finalMyScore < finalOppScore) {
      result = 'loss'; baseXp = 10;
    } else {
      result = 'draw'; baseXp = 25;
    }

    const totalXp = baseXp + lastSpeedBonus;
    setResult(result, totalXp);
    setDuelPhase('finished');
    navigate('/result');
  }

  if (!questions.length) return null;
  const q = questions[currentQuestion];
  if (!q) return null;

  return (
    <div className={cn(
      "flex min-h-screen flex-col px-4 py-6 max-w-[420px] mx-auto transition-colors duration-500",
      flashState === 'correct' && 'animate-flash-correct',
      flashState === 'wrong' && 'animate-flash-wrong',
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CountryFlag code={countryCode} size="sm" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground leading-none">{username}</span>
            <span className="font-bold text-primary font-mono text-lg">{myScore}</span>
          </div>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground font-mono">Q{currentQuestion + 1}/5</span>
          <p className="text-lg font-bold text-muted-foreground">vs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground leading-none">{countryName(opponentCountry)}</span>
            <span className="font-bold text-destructive font-mono text-lg">{opponentScore}</span>
          </div>
          <CountryFlag code={opponentCountry} size="sm" />
        </div>
      </div>

      <div className="mb-6">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              timeLeft > 5 ? "bg-primary" : timeLeft > 2 ? "bg-glow-gold" : "bg-destructive"
            )}
            style={{ width: `${(timeLeft / 10) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm font-mono text-muted-foreground mt-1">{timeLeft}s</p>
      </div>

      <div className="text-center mb-4">
        {opponentAnswered[currentQuestion] ? (
          <span className="text-xs text-glow-green font-mono">✓ Opponent answered</span>
        ) : (
          <span className="text-xs text-muted-foreground font-mono animate-pulse">Opponent thinking...</span>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <p className="text-lg font-semibold leading-relaxed">{q.question}</p>
      </div>

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
                "w-full text-left p-4 rounded-xl border transition-all font-medium",
                !showResult && !isSelected && "bg-secondary border-border hover:border-primary hover:bg-secondary/80",
                !showResult && isSelected && "bg-primary/20 border-primary",
                showResult && isCorrect && "bg-glow-green/20 border-glow-green text-foreground scale-[1.02]",
                showResult && isSelected && !isCorrect && "bg-destructive/20 border-destructive scale-95 opacity-80",
                showResult && !isCorrect && !isSelected && "opacity-50",
              )}
            >
              <span className="mr-3 text-muted-foreground font-mono text-sm">
                {String.fromCharCode(65 + i)}
              </span>
              {answer}
              {showResult && isCorrect && <span className="float-right">✓</span>}
              {showResult && isSelected && !isCorrect && <span className="float-right">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
