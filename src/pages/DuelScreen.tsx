import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { cn } from '@/lib/utils';

export default function DuelScreen() {
  const navigate = useNavigate();
  const {
    playerId, roomId, questions, currentQuestion, myScore, opponentScore,
    myAnswers, opponentAnswered, timeLeft, countryCode, opponentCountry,
    submitAnswer, setOpponentAnswered, incrementOpponentScore, nextQuestion,
    setTimeLeft, setDuelPhase, setResult,
  } = useGameState();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId || !questions.length) {
      navigate('/');
      return;
    }
    setDuelPhase('playing');
    setupRealtimeChannel();
    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  useEffect(() => {
    setSelectedAnswer(null);
    setRevealed(false);
    setAnswerStartTime(Date.now());
    startTimer();
  }, [currentQuestion]);

  function setupRealtimeChannel() {
    const channel = supabase
      .channel(`duel-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const answer = payload.new as any;
          if (answer.player_id !== playerId) {
            setOpponentAnswered(answer.question_index);
            if (answer.is_correct) incrementOpponentScore();
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft(useGameState.getState().timeLeft - 1);
      if (useGameState.getState().timeLeft <= 0) {
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

  async function doSubmitAnswer(answer: string | null) {
    const state = useGameState.getState();
    const qi = state.currentQuestion;
    const timeTaken = (Date.now() - answerStartTime) / 1000;
    const isCorrect = answer === state.questions[qi]?.correct_answer;

    submitAnswer(qi, answer || '');

    // Save to DB
    await supabase.from('answers').insert({
      room_id: roomId,
      player_id: playerId,
      question_index: qi,
      answer: answer || '',
      time_taken: timeTaken,
      is_correct: isCorrect,
    });

    // Calculate speed bonus XP
    const speedBonus = timeTaken < 3 ? 10 : 0;

    setRevealed(true);

    // Wait then move to next question or finish
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

  async function finishDuel(lastSpeedBonus: number) {
    const state = useGameState.getState();
    const finalMyScore = state.myScore;
    const finalOppScore = state.opponentScore;

    let result: 'win' | 'loss' | 'draw';
    let baseXp: number;

    if (finalMyScore > finalOppScore) {
      result = 'win';
      baseXp = 50;
    } else if (finalMyScore < finalOppScore) {
      result = 'loss';
      baseXp = 10;
    } else {
      result = 'draw';
      baseXp = 25;
    }

    const totalXp = baseXp + lastSpeedBonus;
    setResult(result, totalXp);

    // Update player stats
    const updates: any = { xp: state.xp + totalXp };
    if (result === 'win') {
      updates.wins = (await supabase.from('players').select('wins').eq('id', playerId).single()).data?.wins + 1 || 1;
    } else if (result === 'loss') {
      updates.losses = (await supabase.from('players').select('losses').eq('id', playerId).single()).data?.losses + 1 || 1;
    }

    await supabase.from('players').update(updates).eq('id', playerId);
    setDuelPhase('finished');
    navigate('/result');
  }

  if (!questions.length) return null;

  const q = questions[currentQuestion];
  if (!q) return null;

  return (
    <div className="flex min-h-screen flex-col px-4 py-6 max-w-[420px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CountryFlag code={countryCode} size="sm" />
          <span className="font-bold text-primary font-mono">{myScore}</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground font-mono">Q{currentQuestion + 1}/5</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-destructive font-mono">{opponentScore}</span>
          <CountryFlag code={opponentCountry} size="sm" />
        </div>
      </div>

      {/* Timer */}
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

      {/* Opponent status */}
      <div className="text-center mb-4">
        {opponentAnswered[currentQuestion] ? (
          <span className="text-xs text-glow-green font-mono">✓ Opponent answered</span>
        ) : (
          <span className="text-xs text-muted-foreground font-mono animate-pulse">Opponent thinking...</span>
        )}
      </div>

      {/* Question */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <p className="text-lg font-semibold leading-relaxed">{q.question}</p>
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
                "w-full text-left p-4 rounded-xl border transition-all font-medium",
                !showResult && !isSelected && "bg-secondary border-border hover:border-primary hover:bg-secondary/80",
                !showResult && isSelected && "bg-primary/20 border-primary",
                showResult && isCorrect && "bg-glow-green/20 border-glow-green text-foreground",
                showResult && isSelected && !isCorrect && "bg-destructive/20 border-destructive",
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
