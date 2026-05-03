import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { countryName } from '@/lib/country';
import { cn } from '@/lib/utils';
import { playCorrect, playWrong, playClick, playMusicDuel } from '@/lib/sounds';
import { SpaceBackground } from '@/components/SpaceBackground';

type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Color = 'w' | 'b';
type Piece = { type: PieceType; color: Color } | null;
type Board = Piece[][];

const PIECE_UNICODE: Record<PieceType, Record<Color, string>> = {
  K: { w: '♔', b: '♚' }, Q: { w: '♕', b: '♛' },
  R: { w: '♖', b: '♜' }, B: { w: '♗', b: '♝' },
  N: { w: '♘', b: '♞' }, P: { w: '♙', b: '♟' },
};

function initBoard(): Board {
  const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow: PieceType[] = ['R','N','B','Q','K','B','N','R'];
  backRow.forEach((type, i) => {
    b[0][i] = { type, color: 'b' };
    b[7][i] = { type, color: 'w' };
  });
  for (let i = 0; i < 8; i++) {
    b[1][i] = { type: 'P', color: 'b' };
    b[6][i] = { type: 'P', color: 'w' };
  }
  return b;
}

function getMoves(board: Board, row: number, col: number): [number, number][] {
  const piece = board[row][col];
  if (!piece) return [];
  const moves: [number, number][] = [];
  const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const canMove = (r: number, c: number) => inBounds(r, c) && board[r][c]?.color !== piece.color;
  const slide = (dr: number, dc: number) => {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      if (board[r][c]) { if (board[r][c]!.color !== piece.color) moves.push([r, c]); break; }
      moves.push([r, c]); r += dr; c += dc;
    }
  };

  if (piece.type === 'P') {
    const dir = piece.color === 'w' ? -1 : 1;
    const startRow = piece.color === 'w' ? 6 : 1;
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
      moves.push([row + dir, col]);
      if (row === startRow && !board[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
    }
    [-1, 1].forEach(dc => {
      if (inBounds(row + dir, col + dc) && board[row + dir][col + dc]?.color !== piece.color && board[row + dir][col + dc])
        moves.push([row + dir, col + dc]);
    });
  }
  if (piece.type === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
      if (canMove(row+dr, col+dc)) moves.push([row+dr, col+dc]);
    });
  }
  if (piece.type === 'K') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => {
      if (canMove(row+dr, col+dc)) moves.push([row+dr, col+dc]);
    });
  }
  if (['R','Q'].includes(piece.type)) { [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc]) => slide(dr,dc)); }
  if (['B','Q'].includes(piece.type)) { [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc]) => slide(dr,dc)); }

  return moves;
}

export default function ChessScreen() {
  const navigate = useNavigate();
  const { roomId, countryCode, opponentCountry, username, setResult, setScores, setDuelPhase } = useGameState();

  const [board, setBoard] = useState<Board>(initBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [capturedByMe, setCapturedByMe] = useState<Piece[]>([]);
  const [capturedByOpp, setCapturedByOpp] = useState<Piece[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [timer, setTimer] = useState(600); // 10 min total
  const timerRef = useState<ReturnType<typeof setInterval> | null>(null);

  const myColor: Color = 'w';
  const oppColor: Color = 'b';

  useEffect(() => {
    if (!roomId) { navigate('/'); return; }
    playMusicDuel();
    setDuelPhase('playing');
    const t = setInterval(() => setTimer(p => { if (p <= 1) { clearInterval(t); finishGame('loss'); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, []);

  // AI move
  useEffect(() => {
    if (!isMyTurn && !gameOver) {
      const delay = 800 + Math.random() * 1200;
      setTimeout(() => {
        setBoard(prev => {
          const newBoard = prev.map(r => [...r]);
          // Find all black pieces and their moves
          const allMoves: { from: [number,number]; to: [number,number] }[] = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (newBoard[r][c]?.color === oppColor) {
                const moves = getMoves(newBoard, r, c);
                moves.forEach(to => allMoves.push({ from: [r,c], to }));
              }
            }
          }
          if (allMoves.length === 0) { finishGame('win'); return prev; }

          // Prefer captures
          const captures = allMoves.filter(m => newBoard[m.to[0]][m.to[1]] !== null);
          const move = captures.length > 0
            ? captures[Math.floor(Math.random() * captures.length)]
            : allMoves[Math.floor(Math.random() * allMoves.length)];

          const captured = newBoard[move.to[0]][move.to[1]];
          if (captured?.type === 'K') { finishGame('loss'); return prev; }
          if (captured) setCapturedByOpp(p => [...p, captured]);

          newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
          newBoard[move.from[0]][move.from[1]] = null;
          playWrong();
          setMoveCount(m => m + 1);
          setIsMyTurn(true);
          return newBoard;
        });
      }, delay);
    }
  }, [isMyTurn, gameOver]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!isMyTurn || gameOver) return;
    const piece = board[row][col];

    if (selected) {
      const isValid = validMoves.some(([r,c]) => r === row && c === col);
      if (isValid) {
        playClick();
        const newBoard = board.map(r => [...r]);
        const captured = newBoard[row][col];
        if (captured?.type === 'K') { finishGame('win'); return; }
        if (captured) setCapturedByMe(p => [...p, captured]);
        newBoard[row][col] = newBoard[selected[0]][selected[1]];
        newBoard[selected[0]][selected[1]] = null;
        // Pawn promotion
        if (newBoard[row][col]?.type === 'P' && row === 0) newBoard[row][col] = { type: 'Q', color: myColor };
        setBoard(newBoard);
        setSelected(null);
        setValidMoves([]);
        setMoveCount(m => m + 1);
        setIsMyTurn(false);
        return;
      }
      setSelected(null);
      setValidMoves([]);
    }

    if (piece?.color === myColor) {
      setSelected([row, col]);
      setValidMoves(getMoves(board, row, col));
    }
  }, [isMyTurn, gameOver, board, selected, validMoves]);

  function finishGame(result: 'win' | 'loss' | 'draw') {
    if (gameOver) return;
    setGameOver(true);
    const myS = capturedByMe.length;
    const oppS = capturedByOpp.length;
    setScores(myS, oppS);
    const xp = result === 'win' ? 60 : result === 'draw' ? 25 : 10;
    const currentXp = useGameState.getState().xp;
    useGameState.setState({ xp: currentXp + xp });
    setResult(result, xp);
    setDuelPhase('finished');
    setTimeout(() => navigate('/result'), 500);
  }

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const timerDanger = timer <= 60;

  return (
    <div className="relative min-h-screen">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-2 py-4 max-w-[420px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <CountryFlag code={countryCode} size="sm" />
            <span className="text-primary font-bold font-mono text-glow-cyan">{capturedByMe.length}♟</span>
          </div>
          <div className="text-center">
            <p className={cn("font-mono font-bold text-lg", timerDanger ? "text-destructive animate-pulse" : "text-primary")}>
              {mins}:{secs.toString().padStart(2,'0')}
            </p>
            <p className="text-xs text-muted-foreground font-display">{isMyTurn ? 'YOUR TURN' : 'OPPONENT'}</p>
          </div>
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
            <span className="text-destructive font-bold font-mono">{capturedByOpp.length}♟</span>
            <CountryFlag code={opponentCountry} size="sm" />
          </div>
        </div>

        {/* Opponent captured pieces */}
        <div className="w-full px-2 h-6 mb-1 flex items-center">
          <span className="text-sm">{capturedByOpp.map((p,i) => p ? PIECE_UNICODE[p.type][p.color] : '').join('')}</span>
        </div>

        {/* Chess Board */}
        <div className="w-full aspect-square rounded-xl overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(234,179,8,0.3), 0 0 80px rgba(234,179,8,0.1)' }}>
          {board.map((row, ri) => (
            <div key={ri} className="flex" style={{ height: '12.5%' }}>
              {row.map((piece, ci) => {
                const isLight = (ri + ci) % 2 === 0;
                const isSelected = selected?.[0] === ri && selected?.[1] === ci;
                const isValid = validMoves.some(([r,c]) => r === ri && c === ci);
                const isCapture = isValid && piece !== null;
                return (
                  <button
                    key={ci}
                    onClick={() => handleSquareClick(ri, ci)}
                    className={cn(
                      "flex-1 flex items-center justify-center relative transition-all duration-150",
                      isLight ? "bg-[#e8d5b7]" : "bg-[#b58863]",
                      isSelected && "bg-yellow-400",
                      isValid && !isCapture && "bg-green-400/60",
                      isCapture && "bg-red-400/60",
                      piece?.color === myColor && isMyTurn && !selected && "hover:brightness-110 cursor-pointer",
                    )}
                    style={{ width: '12.5%' }}
                  >
                    {isValid && !piece && (
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    )}
                    {piece && (
                      <span className={cn(
                        "select-none leading-none",
                        "text-2xl",
                        piece.color === 'w' ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : "drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]"
                      )}>
                        {PIECE_UNICODE[piece.type][piece.color]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* My captured pieces */}
        <div className="w-full px-2 h-6 mt-1 flex items-center">
          <span className="text-sm">{capturedByMe.map((p,i) => p ? PIECE_UNICODE[p.type][p.color] : '').join('')}</span>
        </div>

        {/* Turn indicator */}
        <div className="glass-card rounded-xl px-4 py-2 text-center mt-3">
          <p className={cn("text-sm font-display font-bold tracking-wider",
            isMyTurn ? "text-primary text-glow-cyan" : "text-muted-foreground")}>
            {gameOver ? 'GAME OVER' : isMyTurn ? 'YOUR TURN — TAP A PIECE' : "OPPONENT'S TURN..."}
          </p>
        </div>
      </div>
    </div>
  );
}
