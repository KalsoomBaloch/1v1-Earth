import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { cn } from '@/lib/utils';
import { playCorrect, playWrong, playClick, playMusicDuel } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';

type CellValue = 'X' | 'O' | null;
type Board = CellValue[];

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diags
];

function checkWinner(board: Board): { winner: CellValue; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => (cell === null ? [...acc, i] : acc), []);
}

export default function TicTacToeScreen() {
  const navigate = useNavigate();
  const { roomId, countryCode, opponentCountry, username, setResult, setScores, setDuelPhase } = useGameState();

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [turnTimer, setTurnTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const mySymbol: CellValue = 'X';
  const oppSymbol: CellValue = 'O';

  useEffect(() => {
    if (!roomId) { navigate('/'); return; }
    playMusicDuel();
    setDuelPhase('playing');
    startTurnTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  function startTurnTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTurnTimer(30);
    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Handle turn timer expiry
  useEffect(() => {
    if (turnTimer === 0 && !gameOver) {
      if (isMyTurn) {
        // Auto-play random cell for player
        const empty = getEmptyCells(board);
        if (empty.length > 0) {
          const randomCell = empty[Math.floor(Math.random() * empty.length)];
          handleCellClick(randomCell);
        }
      }
    }
  }, [turnTimer]);

  // AI opponent move
  useEffect(() => {
    if (!isMyTurn && !gameOver) {
      const delay = 1000 + Math.random() * 1000;
      aiTimeoutRef.current = setTimeout(() => {
        setBoard(prev => {
          const empty = getEmptyCells(prev);
          if (empty.length === 0) return prev;
          const cell = empty[Math.floor(Math.random() * empty.length)];
          const newBoard = [...prev];
          newBoard[cell] = oppSymbol;

          // Check result after AI move
          const { winner, line } = checkWinner(newBoard);
          if (winner) {
            setWinLine(line);
            setGameOver(true);
            if (timerRef.current) clearInterval(timerRef.current);
            playWrong();
            setTimeout(() => finishGame('loss', newBoard), 1500);
          } else if (getEmptyCells(newBoard).length === 0) {
            setGameOver(true);
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => finishGame('draw', newBoard), 1500);
          } else {
            setIsMyTurn(true);
            startTurnTimer();
          }
          return newBoard;
        });
      }, delay);
    }
  }, [isMyTurn, gameOver]);

  const handleCellClick = useCallback((index: number) => {
    if (!isMyTurn || gameOver || board[index] !== null) return;
    playClick();
    if (timerRef.current) clearInterval(timerRef.current);

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);

    const { winner, line } = checkWinner(newBoard);
    if (winner) {
      setWinLine(line);
      setGameOver(true);
      playCorrect();
      setTimeout(() => finishGame('win', newBoard), 1500);
    } else if (getEmptyCells(newBoard).length === 0) {
      setGameOver(true);
      setTimeout(() => finishGame('draw', newBoard), 1500);
    } else {
      setIsMyTurn(false);
    }
  }, [isMyTurn, gameOver, board]);

  function finishGame(result: 'win' | 'loss' | 'draw', finalBoard: Board) {
    const myCount = finalBoard.filter(c => c === mySymbol).length;
    const oppCount = finalBoard.filter(c => c === oppSymbol).length;
    setScores(myCount, oppCount);

    let xp: number;
    if (result === 'win') xp = 30;
    else if (result === 'draw') xp = 15;
    else xp = 5;

    const currentXp = useGameState.getState().xp;
    useGameState.setState({ xp: currentXp + xp });

    setResult(result, xp);
    setDuelPhase('finished');
    navigate('/result');
  }

  const timerDanger = turnTimer <= 5;

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-6 max-w-[420px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <CountryFlag code={countryCode} size="sm" />
            <div className="flex flex-col">
              <span className="text-[10px] text-primary/60 font-display tracking-wider leading-none">{username}</span>
              <span className="font-bold text-primary font-mono text-lg text-glow-cyan">X</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-black text-glow-cyan">⚡VS⚡</p>
          </div>
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-primary/60 font-display tracking-wider leading-none">{countryName(opponentCountry)}</span>
              <span className="font-bold text-destructive font-mono text-lg text-glow-red">O</span>
            </div>
            <CountryFlag code={opponentCountry} size="sm" />
          </div>
        </div>

        {/* Timer */}
        <div className="w-full mb-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                timerDanger ? "bg-destructive animate-pulse" : "bg-primary",
              )}
              style={{
                width: `${(turnTimer / 30) * 100}%`,
                boxShadow: timerDanger
                  ? '0 0 15px rgba(255, 60, 60, 0.6)'
                  : '0 0 15px rgba(0, 245, 255, 0.4)',
              }}
            />
          </div>
          <p className={cn(
            "text-center text-sm font-mono mt-1",
            timerDanger ? "text-destructive text-glow-red font-bold" : "text-primary/60"
          )}>{turnTimer}s</p>
        </div>

        {/* Turn indicator */}
        <div className="text-center mb-6">
          {gameOver ? (
            <span className="text-lg font-display font-bold tracking-wider text-glow-cyan animate-pulse">GAME OVER</span>
          ) : isMyTurn ? (
            <span className="text-lg font-display font-bold tracking-wider text-primary text-glow-cyan animate-pulse">YOUR TURN</span>
          ) : (
            <span className="text-lg font-display font-bold tracking-wider text-muted-foreground animate-pulse">OPPONENT'S TURN</span>
          )}
        </div>

        {/* Board */}
        <div className="relative w-full max-w-[320px] aspect-square mb-8">
          {/* Grid background glow */}
          <div className="absolute inset-0 rounded-2xl" style={{
            boxShadow: '0 0 40px rgba(0, 245, 255, 0.1), 0 0 80px rgba(0, 245, 255, 0.05)',
          }} />

          <div className="grid grid-cols-3 gap-2 w-full h-full">
            {board.map((cell, i) => {
              const isWinCell = winLine?.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  disabled={!isMyTurn || gameOver || cell !== null}
                  className={cn(
                    "relative rounded-xl flex items-center justify-center text-5xl font-black font-display transition-all duration-200",
                    "glass-card border border-primary/20",
                    !cell && isMyTurn && !gameOver && "hover:border-primary/60 hover:scale-105 cursor-pointer",
                    !cell && isMyTurn && !gameOver && "hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]",
                    cell && "cursor-default",
                    isWinCell && "border-yellow-400 bg-yellow-400/10 scale-105",
                  )}
                  style={isWinCell ? {
                    boxShadow: '0 0 25px rgba(250, 204, 21, 0.5), 0 0 50px rgba(250, 204, 21, 0.2)',
                  } : undefined}
                >
                  {cell && (
                    <span
                      className={cn(
                        "animate-scale-in",
                        cell === 'X' ? "text-primary text-glow-cyan" : "text-destructive text-glow-red",
                        isWinCell && "text-yellow-400"
                      )}
                      style={isWinCell ? { textShadow: '0 0 20px rgba(250, 204, 21, 0.8)' } : undefined}
                    >
                      {cell}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game info */}
        <div className="glass-card rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground font-display tracking-wider">TIC TAC TOE • BEST OF ONE</p>
        </div>
      </div>
    </div>
  );
}