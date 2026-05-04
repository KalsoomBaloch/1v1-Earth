import { create } from 'zustand';
import type { TriviaQuestion } from '@/lib/trivia';

export type GameMode = 'trivia' | 'tictactoe' | 'wordscramble' | 'hangman' | 'emojiguess' | 'chess';

interface GameState {
  // Player
  playerId: string | null;
  userId: string | null;
  countryCode: string;
  username: string;
  xp: number;

  // Room
  roomId: string | null;
  opponentId: string | null;
  opponentCountry: string;
  gameMode: GameMode;

  // Duel
  questions: TriviaQuestion[];
  currentQuestion: number;
  myScore: number;
  opponentScore: number;
  myAnswers: (string | null)[];
  opponentAnswered: boolean[];
  timeLeft: number;
  duelPhase: 'countdown' | 'playing' | 'revealing' | 'finished';

  // Result
  result: 'win' | 'loss' | 'draw' | null;
  xpEarned: number;

  // Actions
  setPlayer: (data: { playerId: string; userId: string; countryCode: string; username: string; xp: number }) => void;
  setRoom: (roomId: string, opponentId: string | null, opponentCountry: string) => void;
  setGameMode: (mode: GameMode) => void;
  setQuestions: (questions: TriviaQuestion[]) => void;
  submitAnswer: (index: number, answer: string | null) => void;
  setOpponentAnswered: (index: number) => void;
  incrementOpponentScore: () => void;
  nextQuestion: () => void;
  setDuelPhase: (phase: GameState['duelPhase']) => void;
  setTimeLeft: (t: number) => void;
  setResult: (result: 'win' | 'loss' | 'draw', xpEarned: number) => void;
  setScores: (my: number, opp: number) => void;
  reset: () => void;
}

const initialDuelState = {
  roomId: null,
  opponentId: null,
  opponentCountry: 'UN',
  gameMode: 'trivia' as GameMode,
  questions: [],
  currentQuestion: 0,
  myScore: 0,
  opponentScore: 0,
  myAnswers: [null, null, null, null, null] as (string | null)[],
  opponentAnswered: [false, false, false, false, false],
  timeLeft: 10,
  duelPhase: 'countdown' as const,
  result: null,
  xpEarned: 0,
};

export const useGameState = create<GameState>((set) => ({
  playerId: null,
  userId: null,
  countryCode: 'UN',
  username: 'Player',
  xp: 0,
  ...initialDuelState,

  setPlayer: (data) => set(data),

  setRoom: (roomId, opponentId, opponentCountry) =>
    set({ roomId, opponentId, opponentCountry }),

  setGameMode: (gameMode) => set({ gameMode }),

  setQuestions: (questions) => set({ questions }),

  submitAnswer: (index, answer) =>
    set((s) => {
      const myAnswers = [...s.myAnswers];
      myAnswers[index] = answer;
      const isCorrect = answer === s.questions[index]?.correct_answer;
      return {
        myAnswers,
        myScore: isCorrect ? s.myScore + 1 : s.myScore,
      };
    }),

  setOpponentAnswered: (index) =>
    set((s) => {
      const opponentAnswered = [...s.opponentAnswered];
      opponentAnswered[index] = true;
      return { opponentAnswered };
    }),

  incrementOpponentScore: () =>
    set((s) => ({ opponentScore: s.opponentScore + 1 })),

  nextQuestion: () =>
    set((s) => ({ currentQuestion: s.currentQuestion + 1, timeLeft: 10 })),

  setDuelPhase: (duelPhase) => set({ duelPhase }),

  setTimeLeft: (timeLeft) => set({ timeLeft }),

  setResult: (result, xpEarned) => set({ result, xpEarned }),

  setScores: (myScore, opponentScore) => set({ myScore, opponentScore }),

  reset: () => set(initialDuelState),
}));
