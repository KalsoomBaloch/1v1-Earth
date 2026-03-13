import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/hooks/useGameState';
import { CountryFlag } from '@/components/CountryFlag';
import { XpBar } from '@/components/XpBar';
import { Button } from '@/components/ui/button';

export default function ResultScreen() {
  const navigate = useNavigate();
  const { result, xpEarned, myScore, opponentScore, countryCode, opponentCountry, xp, reset } = useGameState();

  const resultConfig = {
    win: { emoji: '🏆', text: 'Victory!', color: 'text-glow-green text-glow-green' },
    loss: { emoji: '😞', text: 'Defeat', color: 'text-destructive' },
    draw: { emoji: '🤝', text: 'Draw!', color: 'text-glow-gold text-glow-gold' },
  };

  const config = result ? resultConfig[result] : resultConfig.draw;

  function handleRematch() {
    reset();
    navigate('/matchmaking');
  }

  function handleNewOpponent() {
    reset();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-[420px] mx-auto">
      {/* Result */}
      <div className="text-center mb-8">
        <span className="text-7xl mb-4 block">{config.emoji}</span>
        <h1 className={`text-4xl font-bold ${config.color}`}>{config.text}</h1>
      </div>

      {/* Score Card */}
      <div className="w-full bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <CountryFlag code={countryCode} size="lg" />
            <p className="text-2xl font-bold font-mono mt-2">{myScore}</p>
            <p className="text-xs text-muted-foreground">You</p>
          </div>
          <div className="text-3xl text-muted-foreground font-bold">vs</div>
          <div className="text-center">
            <CountryFlag code={opponentCountry} size="lg" />
            <p className="text-2xl font-bold font-mono mt-2">{opponentScore}</p>
            <p className="text-xs text-muted-foreground">Opponent</p>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="w-full mb-8">
        <XpBar current={xp} gained={xpEarned} />
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <Button onClick={handleRematch} className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground box-glow-blue">
          ⚔️ Rematch
        </Button>
        <Button onClick={handleNewOpponent} variant="secondary" className="w-full h-14 text-lg font-bold">
          🌍 Find New Opponent
        </Button>
        <Button variant="ghost" onClick={() => navigate('/leaderboard')} className="w-full text-muted-foreground">
          🏆 Leaderboard
        </Button>
      </div>
    </div>
  );
}
